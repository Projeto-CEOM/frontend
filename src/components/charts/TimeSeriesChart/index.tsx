import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK } from "../theme";
import type { SeriesDef, SeriesPoint } from "../types";

type TooltipEntry = { dataKey?: unknown; value?: unknown };
type TooltipRenderProps = {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: unknown;
};

type TimeSeriesChartProps = {
  points: SeriesPoint[];
  series: SeriesDef[];
  formatValue: (value: number | null) => string;
  formatTick: (time: number) => string;
  formatFullTime: (time: number) => string;
  limits?: { min: number; max: number } | null;
  minHeight?: number;
};

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  points,
  series,
  formatValue,
  formatTick,
  formatFullTime,
  limits,
  minHeight = 260,
}) => {
  /**
   * Linha precisa de dois pontos para existir. Quando o período agrupa tudo em
   * um ou dois intervalos (janela longa com pouco histórico), sem marcador o
   * gráfico ficaria vazio mesmo havendo dado — então os pontos aparecem.
   */
  const showDots = points.length <= 3;
  const renderTooltip = ({ active, payload, label }: TooltipRenderProps) => {
    if (!active || !payload?.length) return null;

    const rows = series
      .map((definition) => {
        const entry = payload.find((item) => item.dataKey === definition.key);
        const value = typeof entry?.value === "number" ? entry.value : null;
        return { definition, value };
      })
      .filter((row) => row.value !== null);

    if (rows.length === 0) return null;

    return (
      <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
        <p className="mb-1.5 text-[11px] text-ink-faint">
          {typeof label === "number" ? formatFullTime(label) : ""}
        </p>
        <ul className="flex flex-col gap-1">
          {rows.map(({ definition, value }) => (
            <li
              key={definition.key}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: definition.color }}
                />
                <span className="text-ink-soft">{definition.label}</span>
              </span>
              <span className="font-semibold text-ink tabular-nums">
                {formatValue(value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minHeight={minHeight}
      className="min-h-0 flex-1"
    >
      <LineChart
        data={points}
        margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
      >
        <CartesianGrid
          stroke={CHART_INK.grid}
          strokeWidth={1}
          vertical={false}
        />

        {limits && (
          <ReferenceArea
            y1={limits.min}
            y2={limits.max}
            fill={CHART_INK.limitBand}
            fillOpacity={0.04}
            ifOverflow="extendDomain"
          />
        )}

        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(value: number) => formatTick(value)}
          tick={{ fill: CHART_INK.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.grid }}
          minTickGap={32}
        />
        <YAxis
          tickFormatter={(value: number) => formatValue(value)}
          tick={{ fill: CHART_INK.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={64}
        />

        <Tooltip
          content={renderTooltip}
          cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }}
        />

        {series.map((definition) => (
          <Line
            key={definition.key}
            type="monotone"
            dataKey={definition.key}
            name={definition.label}
            stroke={definition.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={
              showDots
                ? {
                    r: 4,
                    strokeWidth: 2,
                    stroke: CHART_INK.surface,
                    fill: definition.color,
                  }
                : false
            }
            activeDot={{
              r: 4,
              strokeWidth: 2,
              stroke: CHART_INK.surface,
              fill: definition.color,
            }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimeSeriesChart;
