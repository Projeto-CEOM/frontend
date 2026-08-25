import {
  ArrowDownRight,
  ArrowUpRight,
  CircleCheck,
  Droplets,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import type { SensorReading } from "@/api/readings";
import type { Sensor } from "@/api/sensors";
import { cn } from "@/utils/cn";
import { formatElapsedSince } from "@/utils/format";
import {
  formatMeasure,
  limitStatusOf,
  MEASURES,
  MEASURE_KEYS,
  type LimitStatus,
  type MeasureKey,
} from "./series";

const MEASURE_ICONS: Record<MeasureKey, LucideIcon> = {
  temperature: Thermometer,
  humidity: Droplets,
};

/** Estado nunca é só cor: cada um traz ícone + texto. */
const STATUS_BADGE: Record<
  Exclude<LimitStatus, "unknown">,
  { label: string; Icon: LucideIcon; className: string }
> = {
  ok: {
    label: "Na faixa",
    Icon: CircleCheck,
    className: "bg-primary/10 text-primary",
  },
  high: {
    label: "Acima do limite",
    Icon: ArrowUpRight,
    className: "bg-danger-soft text-danger",
  },
  low: {
    label: "Abaixo do limite",
    Icon: ArrowDownRight,
    className: "bg-danger-soft text-danger",
  },
};

type CurrentReadingProps = {
  /** A leitura mais recente do recorte — uma só, para as duas grandezas. */
  reading: SensorReading | null;
  /** Sensor que a mediu, de onde saem os limites da comparação. */
  sensor: Sensor | undefined;
  now: number;
  isLoading?: boolean;
};

/**
 * Condições atuais do recorte filtrado. Fica no mesmo cartão dos filtros
 * porque é leitura do mesmo recorte: mudou o filtro, mudou o número.
 */
const CurrentReading: React.FC<CurrentReadingProps> = ({
  reading,
  sensor,
  now,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center gap-8">
        {MEASURE_KEYS.map((measure) => (
          <div key={measure} className="flex flex-col gap-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-surface-hover" />
            <div className="h-7 w-24 animate-pulse rounded-lg bg-surface-hover" />
          </div>
        ))}
      </div>
    );
  }

  if (!reading) {
    return (
      <p className="text-sm text-ink-faint">
        Sem leituras no período selecionado.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
        {MEASURE_KEYS.map((measure) => {
          const Icon = MEASURE_ICONS[measure];
          const value = reading[MEASURES[measure].field];
          const status = limitStatusOf(value, measure, sensor);
          const badge = status === "unknown" ? null : STATUS_BADGE[status];

          return (
            <div key={measure}>
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                <Icon size={14} strokeWidth={1.8} className="text-ink-faint" />
                {MEASURES[measure].label}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {/* Figuras proporcionais: em tamanho grande, dígitos de largura
                    fixa deixam o número solto. */}
                <span
                  className={cn(
                    "text-2xl font-semibold",
                    status === "high" || status === "low"
                      ? "text-danger"
                      : "text-ink",
                  )}
                >
                  {formatMeasure(value, measure)}
                </span>
                {badge && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium",
                      badge.className,
                    )}
                  >
                    <badge.Icon size={12} strokeWidth={2.2} />
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* A origem aparece uma vez só, e não por card: os dois valores vêm da
          mesma leitura, do mesmo sensor, no mesmo instante. */}
      <p className="text-xs text-ink-faint">
        Última leitura · {reading.sensorIdentifier ?? "sensor desconhecido"}
        {reading.roomName ? ` · ${reading.roomName}` : ""} ·{" "}
        {formatElapsedSince(reading.recordedAt, now)}
      </p>
    </div>
  );
};

export default CurrentReading;
