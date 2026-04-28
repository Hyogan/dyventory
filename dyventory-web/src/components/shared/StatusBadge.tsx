import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "secondary";

type KnownStatus =
  | "active"
  | "archived"
  | "draft"
  | "confirmed"
  | "delivered"
  | "cancelled"
  | "returned"
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "refunded"
  | "sent"
  | "received"
  | "partially_received";

const statusMap: Record<
  KnownStatus,
  { label: string; variant: BadgeVariant; dot: string }
> = {
  // Product
  active:    { label: "Active",    variant: "success",   dot: "bg-success-600" },
  archived:  { label: "Archived",  variant: "default",   dot: "bg-fg-muted" },

  // Sale
  draft:     { label: "Draft",     variant: "default",   dot: "bg-fg-muted" },
  confirmed: { label: "Confirmed", variant: "primary",   dot: "bg-primary-500" },
  delivered: { label: "Delivered", variant: "success",   dot: "bg-success-600" },
  cancelled: { label: "Cancelled", variant: "danger",    dot: "bg-danger-500" },
  returned:  { label: "Returned",  variant: "warning",   dot: "bg-warning-600" },

  // Payment
  pending:   { label: "Pending",   variant: "warning",   dot: "bg-warning-600" },
  partial:   { label: "Partial",   variant: "secondary", dot: "bg-secondary-600" },
  paid:      { label: "Paid",      variant: "success",   dot: "bg-success-600" },
  overdue:   { label: "Overdue",   variant: "danger",    dot: "bg-danger-500" },
  refunded:  { label: "Refunded",  variant: "default",   dot: "bg-fg-muted" },

  // Supplier order
  sent:              { label: "Sent",               variant: "primary",   dot: "bg-primary-500" },
  received:          { label: "Received",           variant: "success",   dot: "bg-success-600" },
  partially_received:{ label: "Partially received", variant: "secondary", dot: "bg-secondary-600" },
};

const variantClasses: Record<BadgeVariant, string> = {
  default:   "bg-surface-muted   text-fg-subtle      border border-border",
  primary:   "bg-primary-50      text-primary-700    border border-primary-200",
  success:   "bg-success-50      text-success-700    border border-success-200",
  warning:   "bg-warning-50      text-warning-700    border border-warning-200",
  danger:    "bg-danger-50       text-danger-700     border border-danger-200",
  secondary: "bg-secondary-50    text-secondary-600  border border-secondary-100",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusMap[status as KnownStatus] ?? {
    label: status,
    variant: "default" as BadgeVariant,
    dot: "bg-fg-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        variantClasses[config.variant],
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
      {label ?? config.label}
    </span>
  );
}
