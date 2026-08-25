import type { AlertLog } from "@/api/alerts";
import type { SensorReading } from "@/api/readings";
import type { Sensor } from "@/api/sensors";
import { seriesColor } from "@/components/charts/theme";
import type { SeriesDef, SeriesPoint } from "@/components/charts/types";

export type PeriodKey = "24h" | "7d" | "30d";

export const PERIODS: Record<
  PeriodKey,
  { label: string; ms: number; bucketMs: number }
> = {
  "24h": { label: "24 horas", ms: 24 * 3_600_000, bucketMs: 15 * 60_000 },
  "7d": { label: "7 dias", ms: 7 * 24 * 3_600_000, bucketMs: 2 * 3_600_000 },
  "30d": {
    label: "30 dias",
    ms: 30 * 24 * 3_600_000,
    bucketMs: 12 * 3_600_000,
  },
};

export const PERIOD_KEYS = Object.keys(PERIODS) as PeriodKey[];

export const isPeriodKey = (value: string): value is PeriodKey =>
  value in PERIODS;

export type MeasureKey = "temperature" | "humidity";

type MeasureConfig = {
  label: string;
  unit: string;
  field: keyof Pick<SensorReading, "tempValue" | "humValue">;
  limits: { min: keyof Sensor; max: keyof Sensor };
  decimals: number;
};

export const MEASURES: Record<MeasureKey, MeasureConfig> = {
  temperature: {
    label: "Temperatura",
    unit: "°C",
    field: "tempValue",
    limits: { min: "tempMin", max: "tempMax" },
    decimals: 1,
  },
  humidity: {
    label: "Umidade relativa",
    unit: "%",
    field: "humValue",
    limits: { min: "humidityMin", max: "humidityMax" },
    decimals: 1,
  },
};

export const MEASURE_KEYS = Object.keys(MEASURES) as MeasureKey[];

export const formatMeasure = (
  value: number | null | undefined,
  measure: MeasureKey,
) => {
  if (value === null || value === undefined) return "—";

  const { decimals, unit } = MEASURES[measure];
  return `${value.toFixed(decimals)}${unit}`;
};

export const buildSensorColors = (sensors: Sensor[]) => {
  const ordered = [...sensors].sort((a, b) => Number(a.id) - Number(b.id));

  return new Map(
    ordered.map((sensor, index) => [sensor.id, seriesColor(index)]),
  );
};

export type { SeriesDef, SeriesPoint };

export const sensorSeriesKey = (sensorId: string) => `s-${sensorId}`;

type BuildSeriesArgs = {
  readings: SensorReading[];
  measure: MeasureKey;
  bucketMs: number;
  colors: Map<string, string>;
};

export const buildSeries = ({
  readings,
  measure,
  bucketMs,
  colors,
}: BuildSeriesArgs) => {
  const { field } = MEASURES[measure];
  const totals = new Map<number, Map<string, { sum: number; count: number }>>();
  const labels = new Map<string, string>();

  for (const reading of readings) {
    const value = reading[field];
    if (value === null || value === undefined) continue;

    const time = new Date(reading.recordedAt).getTime();
    if (Number.isNaN(time)) continue;

    const bucket = Math.floor(time / bucketMs) * bucketMs;
    const bySensor = totals.get(bucket) ?? new Map();
    const current = bySensor.get(reading.sensorId) ?? { sum: 0, count: 0 };

    bySensor.set(reading.sensorId, {
      sum: current.sum + value,
      count: current.count + 1,
    });
    totals.set(bucket, bySensor);
    labels.set(
      reading.sensorId,
      reading.sensorIdentifier ?? `Sensor ${reading.sensorId}`,
    );
  }

  const series: SeriesDef[] = [...labels.entries()]
    .map(([sensorId, label]) => ({
      key: sensorSeriesKey(sensorId),
      sensorId,
      label,
      color: colors.get(sensorId) ?? seriesColor(0),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  const points: SeriesPoint[] = [...totals.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucket, bySensor]) => {
      const point: SeriesPoint = { t: bucket };

      for (const { key, sensorId } of series) {
        const entry = bySensor.get(sensorId);
        point[key] = entry ? entry.sum / entry.count : null;
      }

      return point;
    });

  return { points, series };
};

export const latestReading = (readings: SensorReading[]) =>
  readings.reduce<SensorReading | null>((latest, reading) => {
    if (!latest) return reading;

    return new Date(reading.recordedAt) > new Date(latest.recordedAt)
      ? reading
      : latest;
  }, null);

export type LimitStatus = "ok" | "low" | "high" | "unknown";

export const limitStatusOf = (
  value: number | null | undefined,
  measure: MeasureKey,
  sensor: Sensor | undefined,
): LimitStatus => {
  const { limits } = MEASURES[measure];
  if (value === null || value === undefined || !sensor) return "unknown";

  const min = sensor[limits.min];
  const max = sensor[limits.max];
  if (typeof min !== "number" || typeof max !== "number") return "unknown";

  if (value < min) return "low";
  if (value > max) return "high";
  return "ok";
};

export const alertsByRoom = (alerts: AlertLog[]) => {
  const counts = new Map<string, number>();

  for (const alert of alerts) {
    const room = alert.roomName ?? "Sala removida";
    counts.set(room, (counts.get(room) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([room, total]) => ({ room, total }))
    .sort((a, b) => b.total - a.total);
};
