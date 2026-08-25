import { RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatElapsedSince } from "@/utils/format";

type LiveStatusProps = {
  /** `dataUpdatedAt` da query — quando o dado em tela chegou. */
  updatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
  now: number;
};

/**
 * Num monitoramento 24x7 saber se o dado é fresco importa tanto quanto o
 * valor. O painel já revalida sozinho a cada minuto; aqui isso fica visível,
 * com a opção de forçar agora.
 */
const LiveStatus: React.FC<LiveStatusProps> = ({
  updatedAt,
  isFetching,
  onRefresh,
  now,
}) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-ink-faint">
      {isFetching
        ? "Atualizando…"
        : `Atualizado ${formatElapsedSince(updatedAt || null, now)}`}
    </span>
    <button
      type="button"
      onClick={onRefresh}
      disabled={isFetching}
      aria-label="Atualizar agora"
      title="Atualizar agora"
      className="rounded-lg border border-border p-1.5 text-ink-soft transition-colors hover:bg-surface-hover disabled:opacity-50"
    >
      <RefreshCw
        size={14}
        strokeWidth={1.8}
        className={cn(isFetching && "animate-spin")}
      />
    </button>
  </div>
);

export default LiveStatus;
