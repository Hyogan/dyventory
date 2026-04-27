import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "secondary";

const variantClasses: Record<Variant, string> = {
  default:   "bg-surface-muted   text-fg-subtle      border border-border",
  primary:   "bg-primary-50      text-primary-700    border border-primary-200",
  success:   "bg-success-50      text-success-700    border border-success-200",
  warning:   "bg-warning-50      text-warning-700    border border-warning-200",
  danger:    "bg-danger-50       text-danger-700     border border-danger-200",
  secondary: "bg-secondary-50    text-secondary-600  border border-secondary-100",
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
