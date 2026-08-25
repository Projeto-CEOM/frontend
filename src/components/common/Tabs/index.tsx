import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type TabItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Sinaliza pendência sem obrigar a abrir a aba. */
  badge?: { count: number; tone?: "danger" | "neutral"; title?: string };
};

type TabsProps = {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  /** Prefixo dos ids de acessibilidade (`aria-controls`). */
  idPrefix: string;
};

const Tabs: React.FC<TabsProps> = ({ items, active, onChange, idPrefix }) => (
  <div role="tablist" className="flex gap-1 border-b border-border">
    {items.map(({ id, label, icon: Icon, badge }) => {
      const isActive = id === active;

      return (
        <button
          key={id}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${id}`}
          aria-selected={isActive}
          aria-controls={`${idPrefix}-panel-${id}`}
          onClick={() => onChange(id)}
          className={cn(
            "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "border-primary text-primary"
              : "border-transparent text-ink-soft hover:border-border hover:text-ink",
          )}
        >
          {Icon && <Icon size={15} strokeWidth={1.8} />}
          {label}
          {badge && badge.count > 0 && (
            <span
              title={badge.title}
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                badge.tone === "danger"
                  ? "bg-danger-soft text-danger"
                  : "bg-surface-hover text-ink-soft",
              )}
            >
              {badge.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default Tabs;
