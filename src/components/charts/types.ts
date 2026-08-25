export type SeriesPoint = { t: number } & Record<string, number | null>;

export type SeriesDef = {
  key: string;
  sensorId: string;
  label: string;
  color: string;
};
