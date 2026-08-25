import { SEQUENTIAL_STEPS, sequentialStep } from "../theme";
import type { HeatmapCell } from "@/pages/Dashboard/analytics";
import { cn } from "@/utils/cn";

type HeatmapProps = {
  cells: HeatmapCell[];
  rowLabels: string[];
};

const HOUR_TICKS = [0, 6, 12, 18];

const Heatmap: React.FC<HeatmapProps> = ({ cells, rowLabels }) => (
  <div>
    <div className="overflow-x-auto">
      <div className="min-w-130">
        <div className="mb-1 flex gap-0.5 pl-9">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="flex-1 text-center text-[10px] text-ink-faint"
            >
              {HOUR_TICKS.includes(hour) ? `${hour}h` : ""}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          {rowLabels.map((label, weekday) => (
            <div key={label} className="flex items-center gap-0.5">
              <span className="w-9 shrink-0 text-[10px] text-ink-faint">
                {label}
              </span>
              {cells
                .filter((cell) => cell.weekday === weekday)
                .map((cell) => {
                  const color =
                    cell.ratio === null ? null : sequentialStep(cell.ratio);

                  return (
                    <div
                      key={`${cell.weekday}-${cell.hour}`}
                      title={
                        cell.total === 0
                          ? `${label} ${cell.hour}h · sem leituras`
                          : `${label} ${cell.hour}h · ${cell.out} de ${cell.total} leituras fora da faixa`
                      }
                      className={cn(
                        "aspect-square flex-1 rounded-[3px] border",
                        !color && "border-border/70 bg-transparent",
                      )}
                      style={
                        color
                          ? { backgroundColor: color, borderColor: color }
                          : undefined
                      }
                    />
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-faint">
      <span>Menos fora da faixa</span>
      <span className="flex gap-0.5">
        {SEQUENTIAL_STEPS.map((step) => (
          <span
            key={step}
            className="h-3 w-3 rounded-[3px]"
            style={{ backgroundColor: step }}
          />
        ))}
      </span>
      <span>Mais</span>
      <span className="ml-2 flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-[3px] border border-border/70" />
        sem leituras
      </span>
    </div>
  </div>
);

export default Heatmap;
