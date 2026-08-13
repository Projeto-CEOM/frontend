import { useEffect } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectToasts,
  toastDismissed,
  type Toast,
} from "@/store/slices/toastSlice";

const AUTO_DISMISS_MS = 5000;

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    className: "border-primary/30 bg-surface text-ink",
    iconClassName: "text-primary",
  },
  error: {
    icon: XCircle,
    className: "border-danger/30 bg-danger-soft text-danger",
    iconClassName: "text-danger",
  },
  info: {
    icon: Info,
    className: "border-border bg-surface text-ink",
    iconClassName: "text-ink-soft",
  },
} as const;

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const dispatch = useAppDispatch();
  const { icon: Icon, className, iconClassName } = VARIANTS[toast.variant];

  useEffect(() => {
    const timeout = setTimeout(
      () => dispatch(toastDismissed(toast.id)),
      AUTO_DISMISS_MS,
    );

    return () => clearTimeout(timeout);
  }, [dispatch, toast.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-2.5 rounded-xl border p-3.5 shadow-lg",
        className,
      )}
    >
      <Icon
        size={17}
        strokeWidth={1.8}
        className={cn("mt-px shrink-0", iconClassName)}
      />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => dispatch(toastDismissed(toast.id))}
        aria-label="Fechar notificação"
        className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={15} strokeWidth={1.8} />
      </button>
    </div>
  );
};

/** Fila de notificações controlada pelo `toastSlice`. */
const Toaster: React.FC = () => {
  const toasts = useAppSelector(selectToasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default Toaster;
