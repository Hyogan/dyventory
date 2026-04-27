import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface DashboardKpiCardsProps {
  stats: DashboardStats;
  locale: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function ChangeChip({ change, label }: { change: number | null; label: string }) {
  if (change === null) {
    return <span className="text-xs text-fg-muted">{label}</span>;
  }
  const positive = change >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
        positive
          ? "bg-success-50 text-success-700 border border-success-200"
          : "bg-danger-50 text-danger-700 border border-danger-200",
      )}
    >
      {positive ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {Math.abs(change)}%
    </span>
  );
}

export async function DashboardKpiCards({ stats, locale }: DashboardKpiCardsProps) {
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");

  const alertCount =
    stats.alerts.low_stock +
    stats.alerts.expiry_soon +
    stats.alerts.overdue_credits;

  const cards = [
    {
      label: t("revenue_today"),
      value: `${fmt(stats.revenue.today)} F`,
      change: stats.revenue.today_change,
      changeLabel: t("no_change"),
      subText: t("vs_prior"),
      icon: TrendingUp,
      accent: "border-t-primary-500",
      iconBg: "bg-gradient-to-br from-primary-500 to-primary-600",
    },
    {
      label: t("revenue_month"),
      value: `${fmt(stats.revenue.month)} F`,
      change: stats.revenue.month_change,
      changeLabel: t("no_change"),
      subText: t("vs_prior"),
      icon: TrendingUp,
      accent: "border-t-violet-500",
      iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
    },
    {
      label: t("sales_today"),
      value: String(stats.sales_today),
      change: null,
      changeLabel: "",
      subText: t("sales_today_sub"),
      icon: ShoppingCart,
      accent: "border-t-success-600",
      iconBg: "bg-gradient-to-br from-success-600 to-success-700",
    },
    {
      label: t("stock_value"),
      value: `${fmt(stats.stock_value.value_ttc)} F`,
      change: null,
      changeLabel: "",
      subText: `${fmt(stats.stock_value.value_ht)} F ${t("stock_value_ht")}`,
      icon: Package,
      accent: "border-t-warning-600",
      iconBg: "bg-gradient-to-br from-warning-600 to-warning-700",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                "card p-5 border-t-2 flex flex-col gap-3",
                card.accent,
              )}
            >
              {/* Top row: label + icon */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-fg-muted leading-tight">
                  {card.label}
                </p>
                <div
                  className={cn(
                    "size-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    card.iconBg,
                  )}
                >
                  <Icon className="size-4.5 text-white" />
                </div>
              </div>

              {/* Value */}
              <p className="text-2xl font-bold tabular-nums text-fg truncate">
                {card.value}
              </p>

              {/* Trend / sub-label */}
              <div className="flex items-center gap-2 flex-wrap">
                {card.change !== null && (
                  <ChangeChip change={card.change} label={card.changeLabel} />
                )}
                <span className="text-xs text-fg-muted truncate">{card.subText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {alertCount > 0 && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-danger-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="text-sm font-medium">
              {t("alerts_title")}:&nbsp;
              {stats.alerts.low_stock > 0 && (
                <span className="mr-3">
                  {stats.alerts.low_stock} {t("low_stock_alerts")}
                </span>
              )}
              {stats.alerts.expiry_soon > 0 && (
                <span className="mr-3">
                  {stats.alerts.expiry_soon} {t("expiry_alerts")}
                </span>
              )}
              {stats.alerts.overdue_credits > 0 && (
                <span>
                  {stats.alerts.overdue_credits} {t("overdue_credits")}
                </span>
              )}
            </span>
          </div>
          <Link
            href={`/${locale}/stock`}
            className="text-xs font-semibold text-danger-700 underline underline-offset-2 shrink-0 hover:text-danger-800"
          >
            {tc("view")}
          </Link>
        </div>
      )}
    </div>
  );
}
