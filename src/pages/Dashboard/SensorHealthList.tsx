import { CircleCheck, WifiOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatElapsed } from "@/utils/format";
import type { SensorHealth } from "./analytics";

type SensorHealthListProps = {
  health: SensorHealth[];
  isLoading?: boolean;
};

const SensorHealthList: React.FC<SensorHealthListProps> = ({
  health,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-lg bg-surface-hover"
          />
        ))}
      </div>
    );
  }

  if (health.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-faint">
        Nenhum sensor cadastrado.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {health.map((sensor) => (
        <li
          key={sensor.sensorId}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border px-5 py-2",
            sensor.isSilent
              ? "border-danger/30 bg-danger-soft/40"
              : "border-border",
          )}
        >
          <span className="flex min-w-0 items-center gap-5">
            {sensor.isSilent ? (
              <WifiOff
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-danger"
              />
            ) : (
              <CircleCheck
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-primary"
              />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">
                {sensor.label}
              </span>
              <span className="block truncate text-[11px] text-ink-faint">
                {sensor.roomName ?? "Sem sala"}
              </span>
            </span>
          </span>

          <span
            className={cn(
              "shrink-0 text-xs font-medium",
              sensor.isSilent ? "text-danger" : "text-ink-soft",
            )}
          >
            {sensor.minutesAgo === null
              ? "sem envio"
              : formatElapsed(sensor.minutesAgo)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default SensorHealthList;
