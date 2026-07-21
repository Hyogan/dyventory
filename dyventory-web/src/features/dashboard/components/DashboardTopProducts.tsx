import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtNumber } from "@/features/dashboard/utils";
import type { DashboardTopProduct } from "@/types";

interface DashboardTopProductsProps {
  products: DashboardTopProduct[];
  locale: string;
}

const rankStyle: Record<number, string> = {
  1: "bg-warning-100 text-warning-700 border-warning-200",
  2: "bg-surface-muted text-fg-subtle border-border",
  3: "bg-surface-muted text-fg-muted border-border",
};

const barColor: Record<number, string> = {
  1: "bg-primary-500",
  2: "bg-primary-400",
  3: "bg-primary-300",
  4: "bg-primary-200",
  5: "bg-primary-100",
};

export async function DashboardTopProducts({
  products,
  locale,
}: DashboardTopProductsProps) {
  const t = await getTranslations("dashboard");

  const maxRevenue = products.reduce(
    (max, p) => Math.max(max, p.revenue),
    0,
  );

  return (
    <div className="card flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-fg">{t("top_products")}</h3>
          <p className="text-xs text-fg-muted mt-0.5">{t("by_revenue")}</p>
        </div>
        <Link
          href={`/${locale}/reports/sales`}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 transition-colors"
        >
          {t("see_all")}
        </Link>
      </div>

      {/* Body */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-5">
          <div className="size-12 rounded-xl bg-surface-muted border border-border flex items-center justify-center">
            <Package className="size-5 text-fg-muted opacity-50" />
          </div>
          <p className="text-sm text-fg-muted">{t("no_top_products")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {products.map((p, index) => {
            const rank = index + 1;
            const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;

            return (
              <li
                key={p.id}
                className="px-5 py-3.5 hover:bg-surface-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <span
                    className={cn(
                      "size-6 rounded-md border text-[11px] font-bold flex items-center justify-center shrink-0",
                      rankStyle[rank] ?? "bg-surface-muted text-fg-muted border-border",
                    )}
                  >
                    {rank}
                  </span>

                  {/* Product icon */}
                  <div className="size-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                    <Package className="size-3.5 text-primary-500" />
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-fg truncate">
                        {p.name}
                      </p>
                      <span className="text-sm font-semibold text-fg tabular-nums shrink-0">
                        {fmtNumber(p.revenue, locale)} F
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            barColor[rank] ?? "bg-primary-100",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-fg-muted tabular-nums shrink-0 w-16 text-right">
                        {fmtNumber(p.quantity_sold, locale)} {p.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
