import { forwardRef, useRef, useState, type MouseEvent } from "react";
import { Check, ChevronDown, X, type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { useClickOutside } from "../../../hooks/UseClickOutside";

type SelectOption = {
  value: string;
  label: string;
};

interface SelectProps {
  id?: string;
  label?: string;
  labelAction?: React.ReactNode;
  icon?: LucideIcon;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const Select: React.ForwardRefRenderFunction<HTMLButtonElement, SelectProps> = (
  {
    id,
    label,
    labelAction,
    icon: Icon,
    error,
    options,
    placeholder = "Selecione",
    value,
    onChange,
    disabled,
    required,
    className = "",
  },
  ref,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

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

      <div ref={containerRef} className="relative">
        {Icon && (
          <Icon
            size={16}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
          />
        )}

        <button
          ref={ref}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-required={required}
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "flex w-full items-center rounded-lg border bg-surface/60 py-2.5 text-left text-sm text-ink outline-none backdrop-blur-sm transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50",
            Icon ? "pl-9" : "pl-3",
            selectedOption && !disabled ? "pr-16" : "pr-9",
            error ? "border-danger/40" : "border-border",
            className,
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-ink-faint")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar seleção"
              className="pointer-events-auto rounded-md p-1 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          )}
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className={cn(
              "shrink-0 text-ink-faint transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </div>

        {isOpen && (
          <div
            role="listbox"
            className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 truncate px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover",
                      isSelected
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-ink",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check size={15} strokeWidth={2} className="shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-center text-sm text-ink-faint">
                Nenhuma opção disponível.
              </p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
};

Select.displayName = "Select";

export default forwardRef(Select);
