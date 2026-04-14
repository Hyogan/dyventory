import { Badge } from "@/components/ui/Badge";

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

const statusMap: Record<KnownStatus, { label: string; variant: BadgeVariant }> =
  {
    // Product
    active: { label: "Active", variant: "success" },
    archived: { label: "Archived", variant: "default" },

    // Sale
    draft: { label: "Draft", variant: "default" },
    confirmed: { label: "Confirmed", variant: "primary" },
    delivered: { label: "Delivered", variant: "success" },
    cancelled: { label: "Cancelled", variant: "danger" },
    returned: { label: "Returned", variant: "warning" },

    // Payment
    pending: { label: "Pending", variant: "warning" },
    partial: { label: "Partially paid", variant: "secondary" },
    paid: { label: "Paid", variant: "success" },
    overdue: { label: "Overdue", variant: "danger" },
    refunded: { label: "Refunded", variant: "default" },

    // Supplier order
    sent: { label: "Sent", variant: "primary" },
    received: { label: "Received", variant: "success" },
    partially_received: { label: "Partially received", variant: "secondary" },
  };

interface StatusBadgeProps {
  status: string;
  /** Override the display label */
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusMap[status as KnownStatus] ?? {
    label: status,
    variant: "default" as BadgeVariant,
  };

  return <Badge variant={config.variant}>{label ?? config.label}</Badge>;
}
