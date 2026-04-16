"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, CreditCard, ShoppingBag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientSummary } from "@/types";

interface ClientSummaryCardsProps {
  summary: ClientSummary;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function ClientSummaryCards({ summary }: ClientSummaryCardsProps) {
  const t = useTranslations("clients");

  const cards = [
    {
      label: t("summary.total_revenue"),
      value: `${fmt(summary.total_revenue)} F`,
      sub: t("summary.sale_count", { count: summary.sale_count }),
      icon: <TrendingUp className="size-5" />,
      color: "text-primary-600",
      bg: "bg-primary-50 border-primary-100",
    },
    {
      label: t("summary.total_paid"),
      value: `${fmt(summary.total_paid)} F`,
      sub: t("summary.purchases"),
      icon: <ShoppingBag className="size-5" />,
      color: "text-success-600",
      bg: "bg-success-50 border-success-100",
    },
    {
      label: t("summary.outstanding"),
      value: `${fmt(summary.outstanding_balance)} F`,
      sub: t("summary.credit_balance"),
      icon: <AlertCircle className="size-5" />,
      color: summary.outstanding_balance > 0 ? "text-warning-600" : "text-fg-muted",
      bg: summary.outstanding_balance > 0 ? "bg-warning-50 border-warning-100" : "bg-surface-muted border-border",
    },
    {
      label: t("summary.available_credit"),
      value: `${fmt(summary.available_credit)} F`,
      sub: `/ ${fmt(summary.credit_limit)} F`,
      icon: <CreditCard className="size-5" />,
      color: summary.available_credit > 0 ? "text-success-600" : "text-danger-600",
      bg: summary.available_credit > 0 ? "bg-success-50 border-success-100" : "bg-danger-50 border-danger-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={cn("rounded-xl border p-4 flex items-start gap-3", card.bg)}>
          <div className={cn("mt-0.5 shrink-0", card.color)}>{card.icon}</div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">{card.label}</p>
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
