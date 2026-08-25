import type { AlertLog } from "@/api/alerts";
import type { SensorReading } from "@/api/readings";
import type { Room } from "@/api/rooms";
import type { Sensor } from "@/api/sensors";
import { MEASURES, type MeasureKey, MEASURE_KEYS } from "./series";

type SensorIndex = Map<string, Sensor>;

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

export type RoomCompliance = {
  room: string;
  percent: number;
  inRange: number;
  total: number;
};

export const complianceByRoom = (
  readings: SensorReading[],
  sensorById: SensorIndex,
): RoomCompliance[] => {
  const totals = new Map<string, { inRange: number; total: number }>();

  for (const reading of readings) {
    const compliant = readingCompliance(
      reading,
      sensorById.get(reading.sensorId),
    );
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

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type HeatmapCell = {
  weekday: number;
  hour: number;
  total: number;
  out: number;
  ratio: number | null;
};

export const excursionHeatmap = (
  readings: SensorReading[],
  sensorById: SensorIndex,
): HeatmapCell[] => {
  const grid = new Map<string, { total: number; out: number }>();

  for (const reading of readings) {
    const compliant = readingCompliance(
      reading,
      sensorById.get(reading.sensorId),
    );
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

export type DailySwing = {
  day: number;
  min: number;
  max: number;
  amplitude: number;
};

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
        ? {
            min: Math.min(current.min, value),
            max: Math.max(current.max, value),
          }
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

export type RoomStatus = {
  roomId: string;
  roomName: string;
  sensorLabel: string | null;
  recordedAt: string | null;
  values: Record<
    MeasureKey,
    { value: number | null; withinLimits: boolean | null }
  >;
  hasExcursion: boolean;
};

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
            withinLimits: reading
              ? isWithinLimits(reading, sensor, measure)
              : null,
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
    .sort((a, b) => {
      if (a.hasExcursion !== b.hasExcursion) return a.hasExcursion ? -1 : 1;
      if (!a.recordedAt !== !b.recordedAt) return a.recordedAt ? -1 : 1;
      return a.roomName.localeCompare(b.roomName, "pt-BR");
    });
};

export const OFFLINE_AFTER_MS = 30 * 60_000;

export type SensorHealth = {
  sensorId: string;
  label: string;
  roomName: string | null;
  lastReadingAt: string | null;
  minutesAgo: number | null;
  isSilent: boolean;
};

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

export const recentAlerts = (alerts: AlertLog[], limit = 6) =>
  [...alerts]
    .sort(
      (a, b) =>
        new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
    )
    .slice(0, limit);
