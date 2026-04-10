import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "secondary";

const variantClasses: Record<Variant, string> = {
  default:   "bg-surface-muted text-fg-subtle",
  primary:   "bg-primary-100 text-primary-700",
  success:   "bg-success-100 text-success-700",
  warning:   "bg-warning-100 text-warning-600",
  danger:    "bg-danger-100 text-danger-700",
  secondary: "bg-secondary-50 text-secondary-600",
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn("badge", variantClasses[variant], className)}>
      {children}
    </span>
  );
}
