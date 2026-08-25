import { forwardRef, useState } from "react";
import { cn } from "../../../utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "filled" | "ghost" | "menu";
  /** Elemento já renderizado (`<Icone />`), não a referência do componente. */
  icon?: React.ReactNode;
  /** Lado do ícone em relação ao texto. */
  iconPosition?: "start" | "end";
  loading?: boolean;
  loadingText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
}

const Button: React.ForwardRefRenderFunction<HTMLButtonElement, ButtonProps> = (
  {
    className = "",
    variant = "filled",
    children,
    disabled,
    onClick,
    icon,
    iconPosition = "start",
    loading,
    loadingText,
    ...props
  },
  ref,
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const busy = loading ?? isLoading;

  const variants = {
    filled:
      "bg-primary text-white hover:bg-primary-hover border border-transparent",
    outline:
      "bg-surface border-primary text-primary hover:bg-primary/10 border",
    ghost: "text-ink-soft hover:bg-surface-hover border border-transparent",
    menu: "justify-start w-full gap-3 text-ink-soft hover:bg-surface-hover border border-transparent",
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return;
    try {
      setIsLoading(true);
      await onClick(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      ref={ref}
      disabled={disabled || busy}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 font-medium transition-all duration-200 rounded-lg active:scale-[0.97]",
        "disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className,
      )}
      {...props}
    >
      {busy && loadingText ? (
        loadingText
      ) : (
        <>
          {iconPosition === "start" && icon}
          {children}
          {iconPosition === "end" && icon}
        </>
      )}
    </button>
  );
};

Button.displayName = "Button";

export default forwardRef(Button);
