import { forwardRef, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAction?: React.ReactNode;
  icon?: LucideIcon;
  error?: string;
}

const Input: React.ForwardRefRenderFunction<HTMLInputElement, InputProps> = (
  {
    className = "",
    label,
    labelAction,
    icon: Icon,
    error,
    id,
    type = "text",
    ...props
  },
  ref,
) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      {(label || labelAction) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={id} className="text-xs font-medium text-ink-soft">
              {label}
            </label>
          )}
          {labelAction}
        </div>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
          />
        )}

        <input
          ref={ref}
          id={id}
          type={resolvedType}
          className={cn(
            "w-full rounded-lg border bg-surface/60 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none backdrop-blur-sm transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10",
            Icon ? "pl-9" : "pl-3",
            isPassword ? "pr-10" : "pr-3",
            error ? "border-danger/40" : "border-border",
            className,
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-faint hover:text-ink-soft"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff size={16} strokeWidth={1.8} />
            ) : (
              <Eye size={16} strokeWidth={1.8} />
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
};

Input.displayName = "Input";

export default forwardRef(Input);
