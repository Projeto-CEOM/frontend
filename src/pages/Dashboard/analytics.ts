import type { AlertLog } from "@/api/alerts";
import type { SensorReading } from "@/api/readings";
import type { Room } from "@/api/rooms";
import type { Sensor } from "@/api/sensors";
import { MEASURES, type MeasureKey, MEASURE_KEYS } from "./series";

type SensorIndex = Map<string, Sensor>;

/**
 * A leitura está dentro da faixa daquela grandeza?
 * `null` quando não dá para afirmar — sem valor ou sem limite cadastrado.
 * Distinguir "fora" de "não sei" importa: contar desconhecido como conforme
 * inflaria a taxa de conformidade justamente onde falta configuração.
 */
export const isWithinLimits = (
  reading: SensorReading,
  sensor: Sensor | undefined,
  measure: MeasureKey,
): boolean | null => {
  const config = MEASURES[measure];
  const value = reading[config.field];
  if (value === null || value === undefined || !sensor) return null;

  const min = sensor[config.limits.min];
  const max = sensor[config.limits.max];
  if (typeof min !== "number" || typeof max !== "number") return null;

  return value >= min && value <= max;
};

/** Conforme = todas as grandezas com limite conhecido estão dentro da faixa. */
const readingCompliance = (
  reading: SensorReading,
  sensor: Sensor | undefined,
): boolean | null => {
  const checks = MEASURE_KEYS.map((measure) =>
    isWithinLimits(reading, sensor, measure),
  ).filter((result): result is boolean => result !== null);

  if (checks.length === 0) return null;
  return checks.every(Boolean);
};

/* ── Conformidade por sala ────────────────────────────────────────────── */

export type RoomCompliance = {
  room: string;
  /** Percentual de leituras dentro da faixa (0–100). */
  percent: number;
  inRange: number;
  total: number;
};

/**
 * Percentual de **leituras** dentro da faixa — não de tempo. Com o ESP32
 * enviando em intervalo fixo as duas medidas praticamente coincidem, mas o
 * rótulo diz "leituras" porque é isso que de fato foi medido.
 *
 * Ordena da pior para a melhor: quem precisa de atenção aparece primeiro.
 */
export const complianceByRoom = (
  readings: SensorReading[],
  sensorById: SensorIndex,
): RoomCompliance[] => {
  const totals = new Map<string, { inRange: number; total: number }>();

  for (const reading of readings) {
    const compliant = readingCompliance(reading, sensorById.get(reading.sensorId));
    if (compliant === null) continue;

    const room = reading.roomName ?? "Sem sala";
    const current = totals.get(room) ?? { inRange: 0, total: 0 };

    totals.set(room, {
      inRange: current.inRange + (compliant ? 1 : 0),
      total: current.total + 1,
    });
  }

  return [...totals.entries()]
    .map(([room, { inRange, total }]) => ({
      room,
      inRange,
      total,
      percent: total === 0 ? 0 : (inRange / total) * 100,
    }))
    .sort((a, b) => a.percent - b.percent);
};

/* ── Mapa de calor: dia da semana × hora ──────────────────────────────── */

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type HeatmapCell = {
  weekday: number;
  hour: number;
  total: number;
  out: number;
  /** Fração fora da faixa (0–1); `null` quando não houve leitura. */
  ratio: number | null;
};

/**
 * Onde as excursões se concentram ao longo da semana. É o diagnóstico que o
 * projeto pede: risco que só aparece fora do horário comercial (climatização
 * desligada à noite, pico de umidade ao amanhecer) fica visível como faixa.
 */
export const excursionHeatmap = (
  readings: SensorReading[],
  sensorById: SensorIndex,
): HeatmapCell[] => {
  const grid = new Map<string, { total: number; out: number }>();

  for (const reading of readings) {
    const compliant = readingCompliance(reading, sensorById.get(reading.sensorId));
    if (compliant === null) continue;

    const date = new Date(reading.recordedAt);
    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getDay()}-${date.getHours()}`;
    const current = grid.get(key) ?? { total: 0, out: 0 };

    grid.set(key, {
      total: current.total + 1,
      out: current.out + (compliant ? 0 : 1),
    });
  }

  return WEEKDAY_LABELS.flatMap((_, weekday) =>
    Array.from({ length: 24 }, (_, hour) => {
      const entry = grid.get(`${weekday}-${hour}`);

      return {
        weekday,
        hour,
        total: entry?.total ?? 0,
        out: entry?.out ?? 0,
        ratio: entry && entry.total > 0 ? entry.out / entry.total : null,
      };
    }),
  );
};

/* ── Flutuação diária ─────────────────────────────────────────────────── */

export type DailySwing = {
  day: number;
  min: number;
  max: number;
  /** Amplitude do dia (máx − mín). */
  amplitude: number;
};

/**
 * Amplitude por dia. A curva de média esconde justamente o que o projeto trata
 * como risco próprio: a variação brusca que faz o material dilatar e contrair.
 */
export const dailySwing = (
  readings: SensorReading[],
  measure: MeasureKey,
): DailySwing[] => {
  const { field } = MEASURES[measure];
  const days = new Map<number, { min: number; max: number }>();

  for (const reading of readings) {
    const value = reading[field];
    if (value === null || value === undefined) continue;

    const date = new Date(reading.recordedAt);
    if (Number.isNaN(date.getTime())) continue;

    const day = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
    const current = days.get(day);

    days.set(
      day,
      current
        ? { min: Math.min(current.min, value), max: Math.max(current.max, value) }
        : { min: value, max: value },
    );
  }

  return [...days.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, { min, max }]) => ({
      day,
      min,
      max,
      amplitude: max - min,
    }));
};

/* ── Estado atual por sala ────────────────────────────────────────────── */

export type RoomStatus = {
  roomId: string;
  roomName: string;
  sensorLabel: string | null;
  recordedAt: string | null;
  values: Record<MeasureKey, { value: number | null; withinLimits: boolean | null }>;
  /** Alguma grandeza fora da faixa na última leitura. */
  hasExcursion: boolean;
};

/** Última leitura de cada sala — a visão de plantão, sem precisar filtrar. */
export const roomStatuses = (
  readings: SensorReading[],
  rooms: Room[],
  sensorById: SensorIndex,
): RoomStatus[] => {
  const latest = new Map<string, SensorReading>();

  for (const reading of readings) {
    if (!reading.roomId) continue;

    const current = latest.get(reading.roomId);
    if (
      !current ||
      new Date(reading.recordedAt) > new Date(current.recordedAt)
    ) {
      latest.set(reading.roomId, reading);
    }
  }

  return rooms
    .map((room) => {
      const reading = latest.get(room.id);
      const sensor = reading ? sensorById.get(reading.sensorId) : undefined;

      const values = Object.fromEntries(
        MEASURE_KEYS.map((measure) => [
          measure,
          {
            value: reading?.[MEASURES[measure].field] ?? null,
            withinLimits: reading ? isWithinLimits(reading, sensor, measure) : null,
          },
        ]),
      ) as RoomStatus["values"];

      return {
        roomId: room.id,
        roomName: room.name,
        sensorLabel: reading?.sensorIdentifier ?? null,
        recordedAt: reading?.recordedAt ?? null,
        values,
        hasExcursion: MEASURE_KEYS.some(
          (measure) => values[measure].withinLimits === false,
        ),
      };
    })
    // Sala com problema primeiro; sem leitura por último.
    .sort((a, b) => {
      if (a.hasExcursion !== b.hasExcursion) return a.hasExcursion ? -1 : 1;
      if (!a.recordedAt !== !b.recordedAt) return a.recordedAt ? -1 : 1;
      return a.roomName.localeCompare(b.roomName, "pt-BR");
    });
};

/* ── Saúde dos sensores ───────────────────────────────────────────────── */

/**
 * Sem leitura nesse intervalo o sensor é tratado como mudo. Três vezes o
 * intervalo de envio previsto no projeto (10 min) — tolera uma perda de Wi-Fi
 * pontual sem alarme falso.
 */
export const OFFLINE_AFTER_MS = 30 * 60_000;

export type SensorHealth = {
  sensorId: string;
  label: string;
  roomName: string | null;
  lastReadingAt: string | null;
  /** `null` quando nunca enviou nada no período. */
  minutesAgo: number | null;
  isSilent: boolean;
};

/**
 * Quem parou de enviar. Falha silenciosa é o pior caso do monitoramento: sem
 * leitura não há alerta, e o painel fica verde enquanto a sala sai da faixa.
 */
export const sensorHealth = (
  readings: SensorReading[],
  sensors: Sensor[],
  rooms: Room[],
  now = Date.now(),
): SensorHealth[] => {
  const lastBySensor = new Map<string, string>();
  const roomById = new Map(rooms.map((room) => [room.id, room.name]));

  for (const reading of readings) {
    const current = lastBySensor.get(reading.sensorId);
    if (!current || new Date(reading.recordedAt) > new Date(current)) {
      lastBySensor.set(reading.sensorId, reading.recordedAt);
    }
  }

  return sensors
    .map((sensor) => {
      const lastReadingAt = lastBySensor.get(sensor.id) ?? null;
      const elapsed = lastReadingAt
        ? now - new Date(lastReadingAt).getTime()
        : null;

      return {
        sensorId: sensor.id,
        label: sensor.identifier,
        roomName: roomById.get(sensor.roomId) ?? null,
        lastReadingAt,
        minutesAgo: elapsed === null ? null : Math.floor(elapsed / 60_000),
        isSilent: elapsed === null || elapsed > OFFLINE_AFTER_MS,
      };
    })
    .sort((a, b) => {
      if (a.isSilent !== b.isSilent) return a.isSilent ? -1 : 1;
      return (b.minutesAgo ?? Infinity) - (a.minutesAgo ?? Infinity);
    });
};

/* ── Últimos alertas ──────────────────────────────────────────────────── */

export const recentAlerts = (alerts: AlertLog[], limit = 6) =>
  [...alerts]
    .sort(
      (a, b) =>
        new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
    )
    .slice(0, limit);
