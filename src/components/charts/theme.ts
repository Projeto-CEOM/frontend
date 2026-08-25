export const SERIES_COLORS = [
  "#2563eb",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
] as const;

export const MAX_SERIES = SERIES_COLORS.length;

export const SEQUENTIAL_STEPS = [
  "#cde2fb",
  "#86b6ef",
  "#3987e5",
  "#1c5cab",
  "#0d366b",
] as const;

export const sequentialStep = (ratio: number) => {
  if (!Number.isFinite(ratio) || ratio <= 0) return null;

  const index = Math.min(
    SEQUENTIAL_STEPS.length - 1,
    Math.floor(ratio * SEQUENTIAL_STEPS.length),
  );

  return SEQUENTIAL_STEPS[index];
};

export const CHART_INK = {
  surface: "#ffffff",
  grid: "#e2e8f0",
  axis: "#94a3b8",
  label: "#475569",
  limitBand: "#0f172a",
} as const;

export const seriesColor = (index: number) =>
  SERIES_COLORS[index % SERIES_COLORS.length];
