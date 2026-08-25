import { useNavigate } from "react-router-dom";
import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import type { AlertLog } from "@/api/alerts";
import { cn } from "@/utils/cn";
import {
  formatAlertType,
  formatAlertValue,
  formatElapsedSince,
  isAlertViolation,
} from "@/utils/format";
import Button from "@/components/common/Button";

type RecentAlertsListProps = {
  alerts: AlertLog[];
  now: number;
  isLoading?: boolean;
};

const RecentAlertsList: React.FC<RecentAlertsListProps> = ({
  alerts,
  now,
  isLoading = false,
}) => {
  // Antes dos returns antecipados: hook não pode ficar atrás de condicional.
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg bg-surface-hover"
          />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-faint">
        Nenhum alerta no período selecionado.
      </p>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-1.5">
        {alerts.map((alert) => {
          const violation = isAlertViolation(alert.alertType);
          const Icon = violation ? TriangleAlert : CircleCheck;

          return (
            <li
              key={alert.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-5 py-2"
            >
              <span className="flex min-w-0 items-center gap-4">
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={cn(
                    "shrink-0",
                    violation ? "text-danger" : "text-primary",
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">
                    {formatAlertType(alert.alertType)}
                  </span>
                  <span className="block truncate text-[11px] text-ink-faint">
                    {alert.roomName ?? "—"} · {alert.sensorIdentifier ?? "—"}
                  </span>
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold text-ink tabular-nums">
                  {formatAlertValue(alert.alertType, alert.value)}
                </span>
                <span className="block text-[11px] text-ink-faint">
                  {formatElapsedSince(alert.triggeredAt, now)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex justify-center">
        <Button
          onClick={() => navigate("/alertas")}
          className="text-sm"
          icon={<ArrowRight size={16} strokeWidth={2} />}
          iconPosition="end"
          variant="ghost"
          children="Ver histórico completo"
        />
      </div>
    </div>
  );
};

export default RecentAlertsList;
