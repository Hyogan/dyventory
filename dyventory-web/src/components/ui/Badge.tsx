import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("badge", {
  variants: {
    variant: {
      default: "bg-(--surface-muted) text-(--text-secondary)",
      primary: "bg-(--color-primary-100) text-(--color-primary-700)",
      success: "bg-(--color-success-100) text-(--color-success-700)",
      warning: "bg-(--color-warning-100) text-(--color-warning-600)",
      danger: "bg-(--color-danger-100) text-(--color-danger-700)",
      secondary: "bg-(--color-secondary-50) text-(--color-secondary-600)",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
