import type { AlertLog } from "@/api/alerts";
import type {
  ReadingGranularity,
  ReadingSummary,
  SensorReading,
} from "@/api/readings";
import type { Room } from "@/api/rooms";
import type { Sensor } from "@/api/sensors";
import { isAlertViolation } from "@/utils/format";
import { MEASURES, type MeasureKey } from "@/pages/Dashboard/series";
import {
  WEEKDAY_LABELS,
  isWithinLimits,
  OFFLINE_AFTER_MS,
} from "@/pages/Dashboard/analytics";

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export type ReportCell = string | number | null;
export type ReportRow = Record<string, ReportCell>;

export type ReportTable = {
  id: string;
  label: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

export type ReportInput = {
  readings: SensorReading[];
  summaries: ReadingSummary[];
  granularity: ReadingGranularity;
  alerts: AlertLog[];
  rooms: Room[];
  sensors: Sensor[];
  now: number;
};

export type MetricGroup = "alertas" | "ambiente" | "infraestrutura";

export type MetricDefinition = {
  id: string;
  label: string;
  group: MetricGroup;
  description: string;
  requiresRaw?: boolean;
  requiresHourly?: boolean;
  requiresDaily?: boolean;
  build: (input: ReportInput) => ReportTable;
};

export const UNAVAILABLE_RAW =
  "Precisa das leituras individuais, que a API não entrega inteiras para este período.";

export const UNAVAILABLE_HOURLY =
  "Precisa de resolução horária; o período selecionado está agregado por dia.";

export const UNAVAILABLE_DAILY =
  "Precisa de resolução diária; escolha um período maior que 14 dias.";

export const GROUP_LABELS: Record<MetricGroup, string> = {
  alertas: "Alertas",
  ambiente: "Ambiente",
  infraestrutura: "Infraestrutura",
};

const mean = (values: number[]) =>
  values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;

const median = (values: number[]) => {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const standardDeviation = (values: number[]) => {
  const average = mean(values);
  if (average === null || values.length < 2) return null;

  const variance =
    values.reduce((total, value) => total + (value - average) ** 2, 0) /
    (values.length - 1);

  return Math.sqrt(variance);
};

const round = (value: number | null, digits = 1) =>
  value === null ? null : Number(value.toFixed(digits));

const alertFamily = (alertType: string | null): MeasureKey | "co2" | null => {
  if (!alertType) return null;
  if (alertType.startsWith("temperature")) return "temperature";
  if (alertType.startsWith("humidity")) return "humidity";
  if (alertType.startsWith("co2")) return "co2";
  return null;
};

const FAMILY_LABELS: Record<string, string> = {
  temperature: "Temperatura",
  humidity: "Umidade",
  co2: "CO2",
};

const STATE_LABELS: Record<string, string> = {
  high: "Acima do limite",
  low: "Abaixo do limite",
  ok: "Normalização",
};

const alertState = (alertType: string | null) => {
  if (!alertType) return null;
  const state = alertType.slice(alertType.lastIndexOf("_") + 1);
  return STATE_LABELS[state] ?? state;
};

const roomNameOf = (rooms: Room[]) => {
  const byId = new Map(rooms.map((room) => [room.id, room.name]));
  return (roomId: string | null) => (roomId && byId.get(roomId)) || "Sem sala";
};

const daysCovered = (timestamps: number[]) => {
  if (timestamps.length === 0) return 0;

  const days = new Set(
    timestamps.map((time) => new Date(time).toISOString().slice(0, 10)),
  );

  return days.size;
};

const violationsOnly = (alerts: AlertLog[]) =>
  alerts.filter((alert) => isAlertViolation(alert.alertType));

type NormalizationEpisode = {
  roomId: string | null;
  minutes: number;
};

const normalizationEpisodes = (alerts: AlertLog[]): NormalizationEpisode[] => {
  const streams = new Map<string, AlertLog[]>();

  for (const alert of alerts) {
    const family = alertFamily(alert.alertType);
    if (!family || !alert.sensorId) continue;

    const key = `${alert.sensorId}|${family}`;
    const stream = streams.get(key) ?? [];
    stream.push(alert);
    streams.set(key, stream);
  }

  const episodes: NormalizationEpisode[] = [];

  for (const stream of streams.values()) {
    const ordered = [...stream].sort(
      (a, b) =>
        new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime(),
    );

    let openedAt: number | null = null;
    let openedRoom: string | null = null;

    for (const alert of ordered) {
      const time = new Date(alert.triggeredAt).getTime();

      if (isAlertViolation(alert.alertType)) {
        if (openedAt === null) {
          openedAt = time;
          openedRoom = alert.roomId;
        }
        continue;
      }

      if (openedAt !== null) {
        episodes.push({
          roomId: openedRoom,
          minutes: (time - openedAt) / 60_000,
        });
        openedAt = null;
        openedRoom = null;
      }
    }
  }

  return episodes;
};

const readingsByRoom = (readings: SensorReading[]) => {
  const grouped = new Map<string, SensorReading[]>();

  for (const reading of readings) {
    const key = reading.roomId ?? "";
    const list = grouped.get(key) ?? [];
    list.push(reading);
    grouped.set(key, list);
  }

  return grouped;
};

const measureStatsTable = (
  measure: MeasureKey,
  { readings, rooms }: ReportInput,
): ReportTable => {
  const { label, unit, field, decimals } = MEASURES[measure];
  const nameOf = roomNameOf(rooms);

  const rows = [...readingsByRoom(readings).entries()]
    .map(([roomId, group]) => {
      const values = group
        .map((reading) => reading[field])
        .filter((value): value is number => typeof value === "number");

      return {
        sala: nameOf(roomId || null),
        leituras: values.length,
        minimo: round(values.length ? Math.min(...values) : null, decimals),
        media: round(mean(values), decimals),
        mediana: round(median(values), decimals),
        maximo: round(values.length ? Math.max(...values) : null, decimals),
        desvio: round(standardDeviation(values), 2),
      };
    })
    .filter((row) => row.leituras > 0)
    .sort((a, b) => a.sala.localeCompare(b.sala));

  return {
    id: `stats-${measure}`,
    label: `${label} por sala`,
    columns: [
      { key: "sala", label: "Sala" },
      { key: "leituras", label: "Leituras", align: "right" },
      { key: "minimo", label: `Mínima (${unit})`, align: "right" },
      { key: "media", label: `Média (${unit})`, align: "right" },
      { key: "mediana", label: `Mediana (${unit})`, align: "right" },
      { key: "maximo", label: `Máxima (${unit})`, align: "right" },
      { key: "desvio", label: "Desvio padrão", align: "right" },
    ],
    rows,
  };
};

const excursionTable = (
  measure: MeasureKey,
  { readings, rooms, sensors }: ReportInput,
): ReportTable => {
  const { label, unit } = MEASURES[measure];
  const nameOf = roomNameOf(rooms);
  const sensorById = new Map(sensors.map((sensor) => [sensor.id, sensor]));

  const rows = [...readingsByRoom(readings).entries()]
    .map(([roomId, group]) => {
      let evaluated = 0;
      let outside = 0;
      let below = 0;
      let above = 0;

      for (const reading of group) {
        const sensor = sensorById.get(reading.sensorId);
        const within = isWithinLimits(reading, sensor, measure);
        if (within === null) continue;

        evaluated += 1;
        if (within) continue;

        outside += 1;

        const value = reading[MEASURES[measure].field];
        const min = sensor?.[MEASURES[measure].limits.min];
        if (typeof value === "number" && typeof min === "number" && value < min)
          below += 1;
        else above += 1;
      }

      return {
        sala: nameOf(roomId || null),
        avaliadas: evaluated,
        fora: outside,
        abaixo: below,
        acima: above,
        percentual:
          evaluated === 0 ? null : round((outside / evaluated) * 100, 1),
      };
    })
    .filter((row) => row.avaliadas > 0)
    .sort((a, b) => (b.percentual ?? 0) - (a.percentual ?? 0));

  return {
    id: `excursions-${measure}`,
    label: `Excursões de ${label.toLowerCase()} (${unit})`,
    columns: [
      { key: "sala", label: "Sala" },
      { key: "avaliadas", label: "Leituras avaliadas", align: "right" },
      { key: "fora", label: "Fora do limite", align: "right" },
      { key: "abaixo", label: "Abaixo", align: "right" },
      { key: "acima", label: "Acima", align: "right" },
      { key: "percentual", label: "% fora", align: "right" },
    ],
    rows,
  };
};

export const METRICS: MetricDefinition[] = [
  {
    id: "alerts-by-room",
    group: "alertas",
    label: "Alertas por sala",
    description: "Total de disparos, violações e normalizações em cada sala.",
    build: ({ alerts, rooms }) => {
      const nameOf = roomNameOf(rooms);
      const totals = new Map<
        string,
        { total: number; violations: number; recoveries: number }
      >();

      for (const alert of alerts) {
        const key = nameOf(alert.roomId);
        const entry = totals.get(key) ?? {
          total: 0,
          violations: 0,
          recoveries: 0,
        };

        entry.total += 1;
        if (isAlertViolation(alert.alertType)) entry.violations += 1;
        else entry.recoveries += 1;

        totals.set(key, entry);
      }

      return {
        id: "alerts-by-room",
        label: "Alertas por sala",
        columns: [
          { key: "sala", label: "Sala" },
          { key: "total", label: "Total", align: "right" },
          { key: "violacoes", label: "Violações", align: "right" },
          { key: "normalizacoes", label: "Normalizações", align: "right" },
        ],
        rows: [...totals.entries()]
          .map(([sala, entry]) => ({
            sala,
            total: entry.total,
            violacoes: entry.violations,
            normalizacoes: entry.recoveries,
          }))
          .sort((a, b) => b.total - a.total),
      };
    },
  },
  {
    id: "alerts-by-type",
    group: "alertas",
    label: "Alertas por tipo",
    description: "Distribuição entre temperatura e umidade, acima ou abaixo.",
    build: ({ alerts }) => {
      const totals = new Map<string, number>();

      for (const alert of alerts) {
        const family = alertFamily(alert.alertType);
        const state = alertState(alert.alertType);
        if (!family || !state) continue;

        const key = `${FAMILY_LABELS[family]}|${state}`;
        totals.set(key, (totals.get(key) ?? 0) + 1);
      }

      const grandTotal = [...totals.values()].reduce(
        (sum, value) => sum + value,
        0,
      );

      return {
        id: "alerts-by-type",
        label: "Alertas por tipo",
        columns: [
          { key: "grandeza", label: "Grandeza" },
          { key: "situacao", label: "Situação" },
          { key: "total", label: "Total", align: "right" },
          { key: "percentual", label: "% do total", align: "right" },
        ],
        rows: [...totals.entries()]
          .map(([key, total]) => {
            const [grandeza, situacao] = key.split("|");
            return {
              grandeza,
              situacao,
              total,
              percentual:
                grandTotal === 0 ? null : round((total / grandTotal) * 100, 1),
            };
          })
          .sort((a, b) => b.total - a.total),
      };
    },
  },
  {
    id: "alerts-by-hour",
    group: "alertas",
    label: "Média de alertas por horário",
    description:
      "Disparos em cada hora do dia e a média diária, para achar horários críticos.",
    build: ({ alerts }) => {
      const perHour = new Array(24).fill(0) as number[];
      const times = alerts.map((alert) =>
        new Date(alert.triggeredAt).getTime(),
      );

      for (const alert of alerts) {
        perHour[new Date(alert.triggeredAt).getHours()] += 1;
      }

      const days = daysCovered(times) || 1;

      return {
        id: "alerts-by-hour",
        label: "Média de alertas por horário",
        columns: [
          { key: "hora", label: "Hora" },
          { key: "total", label: "Alertas", align: "right" },
          { key: "mediaDiaria", label: "Média por dia", align: "right" },
        ],
        rows: perHour.map((total, hour) => ({
          hora: `${String(hour).padStart(2, "0")}:00`,
          total,
          mediaDiaria: round(total / days, 2),
        })),
      };
    },
  },
  {
    id: "alerts-by-weekday",
    group: "alertas",
    label: "Alertas por dia da semana",
    description: "Concentração de disparos ao longo da semana.",
    build: ({ alerts }) => {
      const perDay = new Array(7).fill(0) as number[];

      for (const alert of alerts) {
        perDay[new Date(alert.triggeredAt).getDay()] += 1;
      }

      return {
        id: "alerts-by-weekday",
        label: "Alertas por dia da semana",
        columns: [
          { key: "dia", label: "Dia" },
          { key: "total", label: "Alertas", align: "right" },
        ],
        rows: perDay.map((total, index) => ({
          dia: WEEKDAY_LABELS[index],
          total,
        })),
      };
    },
  },
  {
    id: "normalization-time",
    group: "alertas",
    label: "Tempo até normalização",
    description:
      "Quanto tempo cada sala leva para voltar à faixa após um alerta: média, mediana e pior caso.",
    build: ({ alerts, rooms }) => {
      const nameOf = roomNameOf(rooms);
      const byRoom = new Map<string, number[]>();

      for (const episode of normalizationEpisodes(alerts)) {
        const key = nameOf(episode.roomId);
        const list = byRoom.get(key) ?? [];
        list.push(episode.minutes);
        byRoom.set(key, list);
      }

      return {
        id: "normalization-time",
        label: "Tempo até normalização",
        columns: [
          { key: "sala", label: "Sala" },
          { key: "episodios", label: "Episódios", align: "right" },
          { key: "media", label: "Média (min)", align: "right" },
          { key: "mediana", label: "Mediana (min)", align: "right" },
          { key: "maximo", label: "Pior caso (min)", align: "right" },
        ],
        rows: [...byRoom.entries()]
          .map(([sala, durations]) => ({
            sala,
            episodios: durations.length,
            media: round(mean(durations), 1),
            mediana: round(median(durations), 1),
            maximo: round(Math.max(...durations), 1),
          }))
          .sort((a, b) => (b.media ?? 0) - (a.media ?? 0)),
      };
    },
  },
  {
    id: "alerts-by-sensor",
    group: "alertas",
    label: "Sensores com mais alertas",
    description: "Ranking de sensores por número de violações.",
    build: ({ alerts, rooms }) => {
      const nameOf = roomNameOf(rooms);
      const totals = new Map<
        string,
        { sala: string; total: number; violations: number }
      >();

      for (const alert of alerts) {
        const key = alert.sensorIdentifier ?? "Sem sensor";
        const entry = totals.get(key) ?? {
          sala: nameOf(alert.roomId),
          total: 0,
          violations: 0,
        };

        entry.total += 1;
        if (isAlertViolation(alert.alertType)) entry.violations += 1;

        totals.set(key, entry);
      }

      return {
        id: "alerts-by-sensor",
        label: "Sensores com mais alertas",
        columns: [
          { key: "sensor", label: "Sensor" },
          { key: "sala", label: "Sala" },
          { key: "total", label: "Total", align: "right" },
          { key: "violacoes", label: "Violações", align: "right" },
        ],
        rows: [...totals.entries()]
          .map(([sensor, entry]) => ({
            sensor,
            sala: entry.sala,
            total: entry.total,
            violacoes: entry.violations,
          }))
          .sort((a, b) => b.violacoes - a.violacoes),
      };
    },
  },
  {
    id: "alerts-daily",
    group: "alertas",
    label: "Alertas por dia",
    description: "Série diária de disparos no período selecionado.",
    build: ({ alerts }) => {
      const perDay = new Map<string, { total: number; violations: number }>();

      for (const alert of alerts) {
        const day = new Date(alert.triggeredAt).toISOString().slice(0, 10);
        const entry = perDay.get(day) ?? { total: 0, violations: 0 };

        entry.total += 1;
        if (isAlertViolation(alert.alertType)) entry.violations += 1;

        perDay.set(day, entry);
      }

      return {
        id: "alerts-daily",
        label: "Alertas por dia",
        columns: [
          { key: "data", label: "Data" },
          { key: "total", label: "Total", align: "right" },
          { key: "violacoes", label: "Violações", align: "right" },
        ],
        rows: [...perDay.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, entry]) => ({
            data: day.split("-").reverse().join("/"),
            total: entry.total,
            violacoes: entry.violations,
          })),
      };
    },
  },
  {
    id: "stats-temperature",
    requiresRaw: true,
    group: "ambiente",
    label: "Temperatura por sala",
    description: "Mínima, média, mediana, máxima e desvio padrão.",
    build: (input) => measureStatsTable("temperature", input),
  },
  {
    id: "stats-humidity",
    requiresRaw: true,
    group: "ambiente",
    label: "Umidade relativa por sala",
    description: "Mínima, média, mediana, máxima e desvio padrão.",
    build: (input) => measureStatsTable("humidity", input),
  },
  {
    id: "excursions-temperature",
    requiresRaw: true,
    group: "ambiente",
    label: "Excursões de temperatura",
    description: "Leituras fora da faixa configurada, separadas por lado.",
    build: (input) => excursionTable("temperature", input),
  },
  {
    id: "excursions-humidity",
    requiresRaw: true,
    group: "ambiente",
    label: "Excursões de umidade",
    description: "Leituras fora da faixa configurada, separadas por lado.",
    build: (input) => excursionTable("humidity", input),
  },
  {
    id: "compliance",
    requiresRaw: true,
    group: "ambiente",
    label: "Conformidade por sala",
    description:
      "Percentual de leituras dentro dos limites, somando temperatura e umidade.",
    build: ({ readings, rooms, sensors }) => {
      const nameOf = roomNameOf(rooms);
      const sensorById = new Map(sensors.map((sensor) => [sensor.id, sensor]));

      const rows = [...readingsByRoom(readings).entries()]
        .map(([roomId, group]) => {
          let evaluated = 0;
          let inRange = 0;

          for (const reading of group) {
            const sensor = sensorById.get(reading.sensorId);

            for (const measure of ["temperature", "humidity"] as MeasureKey[]) {
              const within = isWithinLimits(reading, sensor, measure);
              if (within === null) continue;

              evaluated += 1;
              if (within) inRange += 1;
            }
          }

          return {
            sala: nameOf(roomId || null),
            avaliadas: evaluated,
            dentro: inRange,
            conformidade:
              evaluated === 0 ? null : round((inRange / evaluated) * 100, 1),
          };
        })
        .filter((row) => row.avaliadas > 0)
        .sort((a, b) => (a.conformidade ?? 0) - (b.conformidade ?? 0));

      return {
        id: "compliance",
        label: "Conformidade por sala",
        columns: [
          { key: "sala", label: "Sala" },
          { key: "avaliadas", label: "Medições avaliadas", align: "right" },
          { key: "dentro", label: "Dentro do limite", align: "right" },
          { key: "conformidade", label: "% conforme", align: "right" },
        ],
        rows,
      };
    },
  },
  {
    id: "daily-swing",
    requiresRaw: true,
    group: "ambiente",
    label: "Amplitude térmica diária",
    description:
      "Diferença entre máxima e mínima de cada dia — variação brusca castiga o acervo.",
    build: ({ readings }) => {
      const days = new Map<string, { min: number; max: number }>();

      for (const reading of readings) {
        const value = reading.tempValue;
        if (typeof value !== "number") continue;

        const day = new Date(reading.recordedAt).toISOString().slice(0, 10);
        const entry = days.get(day) ?? { min: value, max: value };

        entry.min = Math.min(entry.min, value);
        entry.max = Math.max(entry.max, value);
        days.set(day, entry);
      }

      return {
        id: "daily-swing",
        label: "Amplitude térmica diária",
        columns: [
          { key: "data", label: "Data" },
          { key: "minima", label: "Mínima (°C)", align: "right" },
          { key: "maxima", label: "Máxima (°C)", align: "right" },
          { key: "amplitude", label: "Amplitude (°C)", align: "right" },
        ],
        rows: [...days.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, entry]) => ({
            data: day.split("-").reverse().join("/"),
            minima: round(entry.min, 1),
            maxima: round(entry.max, 1),
            amplitude: round(entry.max - entry.min, 1),
          })),
      };
    },
  },
  {
    id: "hourly-profile",
    requiresRaw: true,
    group: "ambiente",
    label: "Perfil médio por hora",
    description:
      "Temperatura e umidade médias em cada hora do dia, somando todo o período.",
    build: ({ readings }) => {
      const perHour = Array.from({ length: 24 }, () => ({
        temps: [] as number[],
        hums: [] as number[],
      }));

      for (const reading of readings) {
        const hour = new Date(reading.recordedAt).getHours();
        if (typeof reading.tempValue === "number")
          perHour[hour].temps.push(reading.tempValue);
        if (typeof reading.humValue === "number")
          perHour[hour].hums.push(reading.humValue);
      }

      return {
        id: "hourly-profile",
        label: "Perfil médio por hora",
        columns: [
          { key: "hora", label: "Hora" },
          { key: "leituras", label: "Leituras", align: "right" },
          { key: "temperatura", label: "Temp. média (°C)", align: "right" },
          { key: "umidade", label: "Umid. média (%)", align: "right" },
        ],
        rows: perHour.map((entry, hour) => ({
          hora: `${String(hour).padStart(2, "0")}:00`,
          leituras: Math.max(entry.temps.length, entry.hums.length),
          temperatura: round(mean(entry.temps), 1),
          umidade: round(mean(entry.hums), 1),
        })),
      };
    },
  },
  {
    id: "sensor-health",
    requiresRaw: true,
    group: "infraestrutura",
    label: "Situação dos sensores",
    description: "Última leitura recebida e sensores em silêncio.",
    build: ({ readings, sensors, rooms, now }) => {
      const nameOf = roomNameOf(rooms);
      const lastBySensor = new Map<string, number>();

      for (const reading of readings) {
        const time = new Date(reading.recordedAt).getTime();
        const current = lastBySensor.get(reading.sensorId);
        if (current === undefined || time > current)
          lastBySensor.set(reading.sensorId, time);
      }

      return {
        id: "sensor-health",
        label: "Situação dos sensores",
        columns: [
          { key: "sensor", label: "Sensor" },
          { key: "sala", label: "Sala" },
          { key: "ultimaLeitura", label: "Última leitura" },
          { key: "minutos", label: "Há (min)", align: "right" },
          { key: "situacao", label: "Situação" },
        ],
        rows: sensors
          .map((sensor) => {
            const last = lastBySensor.get(sensor.id) ?? null;
            const elapsed = last === null ? null : (now - last) / 60_000;

            return {
              sensor: sensor.identifier,
              sala: nameOf(sensor.roomId),
              ultimaLeitura:
                last === null ? "—" : new Date(last).toLocaleString("pt-BR"),
              minutos: round(elapsed, 0),
              situacao:
                last === null
                  ? "Sem leitura"
                  : now - last > OFFLINE_AFTER_MS
                    ? "Em silêncio"
                    : "Ativo",
            };
          })
          .sort((a, b) => (b.minutos ?? 0) - (a.minutos ?? 0)),
      };
    },
  },
  {
    id: "sensor-coverage",
    requiresRaw: true,
    group: "infraestrutura",
    label: "Cobertura de coleta",
    description:
      "Volume de leituras por sensor e intervalo médio entre envios no período.",
    build: ({ readings, sensors, rooms }) => {
      const nameOf = roomNameOf(rooms);
      const identifierOf = new Map(
        sensors.map((sensor) => [sensor.id, sensor.identifier]),
      );
      const grouped = new Map<string, number[]>();

      for (const reading of readings) {
        const list = grouped.get(reading.sensorId) ?? [];
        list.push(new Date(reading.recordedAt).getTime());
        grouped.set(reading.sensorId, list);
      }

      return {
        id: "sensor-coverage",
        label: "Cobertura de coleta",
        columns: [
          { key: "sensor", label: "Sensor" },
          { key: "sala", label: "Sala" },
          { key: "leituras", label: "Leituras", align: "right" },
          { key: "primeira", label: "Primeira" },
          { key: "ultima", label: "Última" },
          { key: "intervalo", label: "Intervalo médio (min)", align: "right" },
        ],
        rows: [...grouped.entries()]
          .map(([sensorId, times]) => {
            const ordered = [...times].sort((a, b) => a - b);
            const first = ordered[0];
            const last = ordered[ordered.length - 1];
            const gaps = ordered.length > 1 ? ordered.length - 1 : 0;

            const sensor = sensors.find((item) => item.id === sensorId);

            return {
              sensor: identifierOf.get(sensorId) ?? sensorId,
              sala: nameOf(sensor?.roomId ?? null),
              leituras: ordered.length,
              primeira: new Date(first).toLocaleString("pt-BR"),
              ultima: new Date(last).toLocaleString("pt-BR"),
              intervalo:
                gaps === 0 ? null : round((last - first) / gaps / 60_000, 1),
            };
          })
          .sort((a, b) => b.leituras - a.leituras),
      };
    },
  },
  {
    id: "room-limits",
    group: "infraestrutura",
    label: "Faixas configuradas",
    description: "Limites de temperatura e umidade cadastrados em cada sala.",
    build: ({ rooms }) => ({
      id: "room-limits",
      label: "Faixas configuradas",
      columns: [
        { key: "sala", label: "Sala" },
        { key: "tempMin", label: "Temp. mín (°C)", align: "right" },
        { key: "tempMax", label: "Temp. máx (°C)", align: "right" },
        { key: "humMin", label: "Umid. mín (%)", align: "right" },
        { key: "humMax", label: "Umid. máx (%)", align: "right" },
      ],
      rows: rooms
        .map((room) => ({
          sala: room.name,
          tempMin: room.tempMin ?? null,
          tempMax: room.tempMax ?? null,
          humMin: room.humidityMin ?? null,
          humMax: room.humidityMax ?? null,
        }))
        .sort((a, b) => a.sala.localeCompare(b.sala)),
    }),
  },
];

type BucketStats = {
  count: number;
  sum: number;
  sumSq: number;
  min: number | null;
  max: number | null;
};

const emptyStats = (): BucketStats => ({
  count: 0,
  sum: 0,
  sumSq: 0,
  min: null,
  max: null,
});

const absorb = (
  target: BucketStats,
  count: number,
  sum: number | null,
  sumSq: number | null,
  min: number | null,
  max: number | null,
) => {
  if (count === 0) return target;

  target.count += count;
  target.sum += sum ?? 0;
  target.sumSq += sumSq ?? 0;
  if (min !== null)
    target.min = target.min === null ? min : Math.min(target.min, min);
  if (max !== null)
    target.max = target.max === null ? max : Math.max(target.max, max);

  return target;
};

const statsAverage = (stats: BucketStats) =>
  stats.count === 0 ? null : stats.sum / stats.count;

const statsDeviation = (stats: BucketStats) => {
  if (stats.count < 2) return null;

  const variance =
    (stats.sumSq - stats.sum ** 2 / stats.count) / (stats.count - 1);

  return variance <= 0 ? 0 : Math.sqrt(variance);
};

const summaryStatsTable = (
  measure: MeasureKey,
  { summaries, rooms }: ReportInput,
): ReportTable => {
  const { label, unit, decimals } = MEASURES[measure];
  const nameOf = roomNameOf(rooms);
  const isTemp = measure === "temperature";
  const byRoom = new Map<string, BucketStats>();

  for (const bucket of summaries) {
    const key = nameOf(bucket.roomId);
    const stats = byRoom.get(key) ?? emptyStats();

    absorb(
      stats,
      isTemp ? bucket.tempCount : bucket.humCount,
      isTemp ? bucket.tempSum : bucket.humSum,
      isTemp ? bucket.tempSumSq : bucket.humSumSq,
      isTemp ? bucket.tempMin : bucket.humMin,
      isTemp ? bucket.tempMax : bucket.humMax,
    );

    byRoom.set(key, stats);
  }

  return {
    id: `summary-stats-${measure}`,
    label: `${label} por sala (agregado)`,
    columns: [
      { key: "sala", label: "Sala" },
      { key: "leituras", label: "Leituras", align: "right" },
      { key: "minimo", label: `Mínima (${unit})`, align: "right" },
      { key: "media", label: `Média (${unit})`, align: "right" },
      { key: "maximo", label: `Máxima (${unit})`, align: "right" },
      { key: "desvio", label: "Desvio padrão", align: "right" },
    ],
    rows: [...byRoom.entries()]
      .filter(([, stats]) => stats.count > 0)
      .map(([sala, stats]) => ({
        sala,
        leituras: stats.count,
        minimo: round(stats.min, decimals),
        media: round(statsAverage(stats), decimals),
        maximo: round(stats.max, decimals),
        desvio: round(statsDeviation(stats), 2),
      }))
      .sort((a, b) => a.sala.localeCompare(b.sala)),
  };
};

METRICS.push(
  {
    id: "summary-stats-temperature",
    group: "ambiente",
    label: "Temperatura por sala (agregado)",
    description:
      "Mínima, média, máxima e desvio calculados pelo servidor. Funciona em qualquer período.",
    build: (input) => summaryStatsTable("temperature", input),
  },
  {
    id: "summary-stats-humidity",
    group: "ambiente",
    label: "Umidade por sala (agregado)",
    description:
      "Mínima, média, máxima e desvio calculados pelo servidor. Funciona em qualquer período.",
    build: (input) => summaryStatsTable("humidity", input),
  },
  {
    id: "summary-daily-swing",
    group: "ambiente",
    label: "Amplitude térmica diária (agregado)",
    description:
      "Diferença entre máxima e mínima de cada dia. Exige o período em resolução diária.",
    requiresDaily: true,
    build: ({ summaries }) => {
      const perDay = new Map<string, BucketStats>();

      for (const bucket of summaries) {
        const day = bucket.periodStart.slice(0, 10);
        const stats = perDay.get(day) ?? emptyStats();

        absorb(
          stats,
          bucket.tempCount,
          bucket.tempSum,
          bucket.tempSumSq,
          bucket.tempMin,
          bucket.tempMax,
        );

        perDay.set(day, stats);
      }

      return {
        id: "summary-daily-swing",
        label: "Amplitude térmica diária (agregado)",
        columns: [
          { key: "data", label: "Data" },
          { key: "minima", label: "Mínima (°C)", align: "right" },
          { key: "media", label: "Média (°C)", align: "right" },
          { key: "maxima", label: "Máxima (°C)", align: "right" },
          { key: "amplitude", label: "Amplitude (°C)", align: "right" },
        ],
        rows: [...perDay.entries()]
          .filter(([, stats]) => stats.count > 0)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, stats]) => ({
            data: day.split("-").reverse().join("/"),
            minima: round(stats.min, 1),
            media: round(statsAverage(stats), 1),
            maxima: round(stats.max, 1),
            amplitude:
              stats.min === null || stats.max === null
                ? null
                : round(stats.max - stats.min, 1),
          })),
      };
    },
  },
  {
    id: "summary-series",
    group: "ambiente",
    label: "Série de médias por período (agregado)",
    description:
      "Uma linha por intervalo, com média e extremos de todos os sensores. Funciona em qualquer período.",
    build: ({ summaries, granularity }) => {
      const perPeriod = new Map<
        string,
        { temp: BucketStats; hum: BucketStats }
      >();

      for (const bucket of summaries) {
        const entry = perPeriod.get(bucket.periodStart) ?? {
          temp: emptyStats(),
          hum: emptyStats(),
        };

        absorb(
          entry.temp,
          bucket.tempCount,
          bucket.tempSum,
          bucket.tempSumSq,
          bucket.tempMin,
          bucket.tempMax,
        );
        absorb(
          entry.hum,
          bucket.humCount,
          bucket.humSum,
          bucket.humSumSq,
          bucket.humMin,
          bucket.humMax,
        );

        perPeriod.set(bucket.periodStart, entry);
      }

      const formatPeriod = (iso: string) =>
        granularity === "day"
          ? new Date(iso).toLocaleDateString("pt-BR")
          : new Date(iso).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

      return {
        id: "summary-series",
        label: "Série de médias por período (agregado)",
        columns: [
          { key: "periodo", label: "Período" },
          { key: "leituras", label: "Leituras", align: "right" },
          { key: "temperatura", label: "Temp. média (°C)", align: "right" },
          { key: "tempMin", label: "Temp. mín", align: "right" },
          { key: "tempMax", label: "Temp. máx", align: "right" },
          { key: "umidade", label: "Umid. média (%)", align: "right" },
        ],
        rows: [...perPeriod.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([periodStart, entry]) => ({
            periodo: formatPeriod(periodStart),
            leituras: Math.max(entry.temp.count, entry.hum.count),
            temperatura: round(statsAverage(entry.temp), 1),
            tempMin: round(entry.temp.min, 1),
            tempMax: round(entry.temp.max, 1),
            umidade: round(statsAverage(entry.hum), 1),
          })),
      };
    },
  },
);

export type MetricAvailability = {
  hasFullRaw: boolean;
  granularity: ReadingGranularity;
};

export const metricUnavailableReason = (
  metric: MetricDefinition,
  { hasFullRaw, granularity }: MetricAvailability,
) => {
  if (metric.requiresRaw && !hasFullRaw) return UNAVAILABLE_RAW;
  if (metric.requiresHourly && granularity !== "hour")
    return UNAVAILABLE_HOURLY;
  if (metric.requiresDaily && granularity !== "day") return UNAVAILABLE_DAILY;
  return null;
};

export const DEFAULT_METRIC_IDS = [
  "alerts-by-room",
  "alerts-by-hour",
  "normalization-time",
  "summary-stats-temperature",
  "summary-stats-humidity",
  "compliance",
];

export const METRICS_BY_GROUP = (
  ["alertas", "ambiente", "infraestrutura"] as MetricGroup[]
).map((group) => ({
  group,
  label: GROUP_LABELS[group],
  metrics: METRICS.filter((metric) => metric.group === group),
}));

export const buildTables = (
  input: ReportInput,
  selectedIds: string[],
  availability: MetricAvailability,
): ReportTable[] =>
  METRICS.filter(
    (metric) =>
      selectedIds.includes(metric.id) &&
      metricUnavailableReason(metric, availability) === null,
  ).map((metric) => metric.build(input));

export const summarize = (alerts: AlertLog[]) => ({
  total: alerts.length,
  violations: violationsOnly(alerts).length,
});
