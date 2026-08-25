import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_INK, SERIES_COLORS } from "../theme";

type CategoryDatum = { label: string; value: number };

type CategoryBarChartProps = {
  data: CategoryDatum[];
  orientation?: "bars" | "columns";
  formatValue?: (value: number) => string;
  domain?: [number, number];
  categoryWidth?: number;
  /** Piso de altura; acima disso o gráfico acompanha o card. */
  minHeight?: number;
};

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data,
  orientation = "bars",
  formatValue = (value) => String(value),
  domain,
  categoryWidth = 132,
  minHeight = 260,
}) => {
  const isHorizontal = orientation === "bars";

  return (
    // `height="100%"` + `flex-1`: preenche o espaço que o card oferece, sem
    // encolher abaixo do piso quando o card é curto.
    <ResponsiveContainer
      width="100%"
      height="100%"
      minHeight={minHeight}
      className="min-h-0 flex-1"
    >
      <BarChart
        data={data}
        layout={isHorizontal ? "vertical" : "horizontal"}
        margin={{
          top: 12,
          right: isHorizontal ? 44 : 12,
          bottom: 4,
          left: isHorizontal ? 8 : -8,
        }}
        barCategoryGap={12}
      >
        <CartesianGrid
          stroke={CHART_INK.grid}
          strokeWidth={1}
          horizontal={!isHorizontal}
          vertical={isHorizontal}
        />

        <XAxis
          {...(isHorizontal
            ? { type: "number" as const, domain, tickFormatter: formatValue }
            : { type: "category" as const, dataKey: "label" })}
          allowDecimals={false}
          tick={{ fill: CHART_INK.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.grid }}
          minTickGap={8}
        />
        <YAxis
          {...(isHorizontal
            ? {
                type: "category" as const,
                dataKey: "label",
                width: categoryWidth,
                axisLine: false,
              }
            : {
                type: "number" as const,
                domain,
                tickFormatter: formatValue,
                width: 56,
                axisLine: false,
              })}
          tick={{ fill: CHART_INK.axis, fontSize: 11 }}
          tickLine={false}
        />

        <Bar
          dataKey="value"
          fill={SERIES_COLORS[0]}
          radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="value"
            position={isHorizontal ? "right" : "top"}
            offset={8}
            fill={CHART_INK.label}
            fontSize={11}
            formatter={(value: unknown) =>
              typeof value === "number" ? formatValue(value) : ""
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CategoryBarChart;
