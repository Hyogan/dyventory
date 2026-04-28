"use client";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm " +
    "hover:bg-primary-700 active:bg-primary-800 " +
    "active:scale-[0.97] " +
    "focus-visible:outline-primary-500",
  secondary:
    "bg-primary-50 text-primary-700 border border-primary-200 " +
    "hover:bg-primary-100 active:bg-primary-200 active:scale-[0.97] " +
    "focus-visible:outline-primary-500",
  ghost:
    "bg-transparent text-fg-subtle " +
    "hover:bg-surface-muted hover:text-fg active:bg-surface-selected active:scale-[0.97] " +
    "focus-visible:outline-primary-500",
  danger:
    "bg-danger-600 text-white shadow-sm " +
    "hover:bg-danger-700 active:bg-danger-800 " +
    "active:scale-[0.97] " +
    "focus-visible:outline-danger-500",
  outline:
    "bg-surface-card border border-border-strong text-fg " +
    "hover:bg-surface-muted active:bg-surface-selected active:scale-[0.97] " +
    "focus-visible:outline-primary-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin size-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
