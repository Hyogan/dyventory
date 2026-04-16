import { TrendingUp, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types";

interface SaleSummaryCardsProps {
  sales: Sale[];
  total: number;
}

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function SaleSummaryCards({ sales, total }: SaleSummaryCardsProps) {
  const revenue = sales
    .filter((s) => s.status === "confirmed" || s.status === "delivered")
    .reduce((sum, s) => sum + parseFloat(s.total_ttc), 0);

  const overdue = sales
    .filter((s) => s.payment_status === "overdue")
    .reduce((sum, s) => sum + parseFloat(s.amount_due), 0);

  const pendingCount = sales.filter(
    (s) => s.status === "draft" || s.payment_status === "pending",
  ).length;

  const confirmedCount = sales.filter(
    (s) => s.status === "confirmed" || s.status === "delivered",
  ).length;

  const cards: StatCard[] = [
    {
      label: "Revenue (TTC)",
      value: `${fmt(revenue)} F`,
      sub: `${total} total sales`,
      icon: <TrendingUp className="size-5" />,
      color: "text-primary-600",
      bg: "bg-primary-50 border-primary-100",
    },
    {
      label: "Confirmed",
      value: String(confirmedCount),
      sub: "on this page",
      icon: <CheckCircle2 className="size-5" />,
      color: "text-success-600",
      bg: "bg-success-50 border-success-100",
    },
    {
      label: "Pending",
      value: String(pendingCount),
      sub: "awaiting action",
      icon: <Clock className="size-5" />,
      color: "text-warning-600",
      bg: "bg-warning-50 border-warning-100",
    },
    {
      label: "Overdue",
      value: `${fmt(overdue)} F`,
      sub: "credit balance due",
      icon: <AlertCircle className="size-5" />,
      color: "text-danger-600",
      bg: "bg-danger-50 border-danger-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "rounded-xl border p-4 flex items-start gap-3",
            card.bg,
          )}
        >
          <div className={cn("mt-0.5 shrink-0", card.color)}>{card.icon}</div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">
              {card.label}
            </p>
            <p className={cn("text-xl font-bold mt-0.5 tabular-nums truncate", card.color)}>
              {card.value}
            </p>
            <p className="text-xs text-fg-muted mt-0.5">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
