import type { SeriesDef } from "../types";

const ChartLegend: React.FC<{ series: SeriesDef[] }> = ({ series }) => {
  if (series.length < 2) return null;

  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((definition) => (
        <li
          key={definition.key}
          className="flex items-center gap-2 text-xs text-ink-soft"
        >
          <span
            aria-hidden
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: definition.color }}
          />
          {definition.label}
        </li>
      ))}
    </ul>
  );
};

export default ChartLegend;
