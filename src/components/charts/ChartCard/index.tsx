import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/utils/cn";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  isLoading?: boolean;
  isFetching?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  table: ReactNode;
  children: ReactNode;
};

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  isLoading = false,
  isFetching = false,
  isEmpty = false,
  emptyMessage = "Sem dados no período selecionado.",
  table,
  children,
}) => {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <div className="flex rounded-lg border border-border p-0.5">
            {(
              [
                { id: "chart", label: "Gráfico", Icon: BarChart3 },
                { id: "table", label: "Tabela", Icon: Table2 },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                title={label}
                className={cn(
                  "relative rounded-md p-1.5 transition-colors",
                  view === id
                    ? "bg-primary/10 text-primary"
                    : "text-ink-faint hover:bg-surface-hover hover:text-ink-soft",
                )}
              >
                <Icon size={15} strokeWidth={1.8} />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative mt-4 flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <div className="min-h-64 flex-1 animate-pulse rounded-xl bg-surface-hover" />
        ) : isEmpty ? (
          <div className="flex min-h-64 flex-1 items-center justify-center text-sm text-ink-faint">
            {emptyMessage}
          </div>
        ) : (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col transition-opacity duration-200",
              isFetching && "opacity-40",
            )}
          >
            {view === "chart" ? children : table}
          </div>
        )}
      </div>
    </section>
  );
};

export default ChartCard;
