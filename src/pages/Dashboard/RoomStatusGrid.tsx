import { CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatElapsedSince } from "@/utils/format";
import type { RoomStatus } from "./analytics";
import { formatMeasure, MEASURES, MEASURE_KEYS } from "./series";

type RoomStatusGridProps = {
  statuses: RoomStatus[];
  now: number;
  isLoading?: boolean;
};

/**
 * Visão de plantão: o estado atual de todas as salas de uma vez, sem filtrar.
 * Sala com excursão vem primeiro (ver `roomStatuses`).
 */
const RoomStatusGrid: React.FC<RoomStatusGridProps> = ({
  statuses,
  now,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-surface-hover"
          />
        ))}
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-faint">
        Nenhuma sala cadastrada.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {statuses.map((status) => {
        const StateIcon = status.hasExcursion ? TriangleAlert : CircleCheck;

        return (
          <article
            key={status.roomId}
            className={cn(
              "rounded-xl border p-4",
              status.hasExcursion
                ? "border-danger/30 bg-danger-soft/40"
                : "border-border bg-surface",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-ink">
                {status.roomName}
              </h3>
              {status.recordedAt && (
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-medium",
                    status.hasExcursion
                      ? "bg-danger-soft text-danger"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <StateIcon size={12} strokeWidth={2.2} />
                  {status.hasExcursion ? "Fora da faixa" : "Na faixa"}
                </span>
              )}
            </div>

            {status.recordedAt ? (
              <>
                <dl className="mt-3 flex gap-6">
                  {MEASURE_KEYS.map((measure) => {
                    const entry = status.values[measure];

                    return (
                      <div key={measure}>
                        <dt className="text-[11px] text-ink-faint">
                          {MEASURES[measure].label}
                        </dt>
                        <dd
                          className={cn(
                            "text-lg font-semibold",
                            entry.withinLimits === false
                              ? "text-danger"
                              : "text-ink",
                          )}
                        >
                          {formatMeasure(entry.value, measure)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                <p className="mt-3 truncate text-[11px] text-ink-faint">
                  {status.sensorLabel} ·{" "}
                  {formatElapsedSince(status.recordedAt, now)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs text-ink-faint">
                Sem leituras no período.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default RoomStatusGrid;
