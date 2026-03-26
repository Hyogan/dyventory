"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-(--color-primary-500) text-white hover:bg-(--color-primary-600) focus-visible:outline-(--color-primary-500)",
  secondary:
    "bg-(--color-primary-50) text-(--color-primary-700) hover:bg-(--color-primary-100) focus-visible:outline-(--color-primary-500)",
  ghost:
    "bg-transparent text-(--text-secondary) hover:bg-(--surface-muted) hover:text-(--text-primary) focus-visible:outline-(--color-primary-500)",
  danger:
    "bg-(--color-danger-500) text-white hover:bg-(--color-danger-600) focus-visible:outline-(--color-danger-500)",
  outline:
    "bg-transparent border border-(--border-default) text-(--text-primary) hover:bg-(--surface-muted) focus-visible:outline-(--color-primary-500)",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        {...props}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded font-medium",
          "transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "select-none whitespace-nowrap",
          variants[variant],
          sizes[size],
          className,
        )}
      >
        {loading ? (
          <Spinner className="size-4 shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
