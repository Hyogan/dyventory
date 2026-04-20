import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
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
        "inline-flex items-center gap-0.5 text-xs font-medium",
        positive ? "text-success-600" : "text-danger-600",
      )}
    >
      {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(change)}%
    </span>
  );
}

export async function DashboardKpiCards({ stats, locale }: DashboardKpiCardsProps) {
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");

  const alertCount =
    stats.alerts.low_stock + stats.alerts.expiry_soon + stats.alerts.overdue_credits;

  const cards = [
    {
      label: t("revenue_today"),
      value: `${fmt(stats.revenue.today)} F`,
      sub: (
        <ChangeChip
          change={stats.revenue.today_change}
          label={t("no_change")}
        />
      ),
      subText: t("vs_prior"),
      icon: TrendingUp,
      color: "text-primary-600",
      bg: "bg-primary-50 border-primary-100",
    },
    {
      label: t("revenue_month"),
      value: `${fmt(stats.revenue.month)} F`,
      sub: (
        <ChangeChip
          change={stats.revenue.month_change}
          label={t("no_change")}
        />
      ),
      subText: t("vs_prior"),
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50 border-violet-100",
    },
    {
      label: t("sales_today"),
      value: String(stats.sales_today),
      sub: null,
      subText: t("sales_today_sub"),
      icon: ShoppingCart,
      color: "text-success-600",
      bg: "bg-success-50 border-success-100",
    },
    {
      label: t("stock_value"),
      value: `${fmt(stats.stock_value.value_ttc)} F`,
      sub: null,
      subText: `${fmt(stats.stock_value.value_ht)} F ${t("stock_value_ht")}`,
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
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
              className={cn("rounded-xl border p-4 flex items-start gap-3", card.bg)}
            >
              <div className={cn("mt-0.5 shrink-0", card.color)}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                  {card.label}
                </p>
                <p className={cn("text-xl font-bold mt-0.5 tabular-nums truncate", card.color)}>
                  {card.value}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {card.sub}
                  <span className="text-xs text-fg-muted">{card.subText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alertCount > 0 && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-danger-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="text-sm font-medium">
              {t("alerts_title")}:&nbsp;
              {stats.alerts.low_stock > 0 && (
                <span className="mr-3">{stats.alerts.low_stock} {t("low_stock_alerts")}</span>
              )}
              {stats.alerts.expiry_soon > 0 && (
                <span className="mr-3">{stats.alerts.expiry_soon} {t("expiry_alerts")}</span>
              )}
              {stats.alerts.overdue_credits > 0 && (
                <span>{stats.alerts.overdue_credits} {t("overdue_credits")}</span>
              )}
            </span>
          </div>
          <Link
            href={`/${locale}/stock`}
            className="text-xs font-medium text-danger-700 underline underline-offset-2 shrink-0"
          >
            {tc("view")}
          </Link>
        </div>
      )}
    </div>
  );
}
