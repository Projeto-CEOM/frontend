import type { SeriesDef, SeriesPoint } from "@/components/charts/types";

type SeriesTableProps = {
  points: SeriesPoint[];
  series: SeriesDef[];
  formatValue: (value: number | null) => string;
  formatTime: (time: number) => string;
};

const SeriesTable: React.FC<SeriesTableProps> = ({
  points,
  series,
  formatValue,
  formatTime,
}) => (
  <div className="max-h-64 overflow-auto rounded-xl border border-border">
    <table className="w-full text-left text-xs">
      <thead className="sticky top-0 bg-surface">
        <tr className="border-b border-border text-ink-faint">
          <th className="px-3 py-2 font-medium">Horário</th>
          {series.map((definition) => (
            <th
              key={definition.key}
              className="px-3 py-2 text-right font-medium"
            >
              {definition.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...points].reverse().map((point) => (
          <tr key={point.t} className="border-b border-border last:border-0">
            <td className="px-3 py-2 text-ink-soft tabular-nums">
              {formatTime(point.t)}
            </td>
            {series.map((definition) => (
              <td
                key={definition.key}
                className="px-3 py-2 text-right text-ink tabular-nums"
              >
                {formatValue(point[definition.key] as number | null)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SeriesTable;
