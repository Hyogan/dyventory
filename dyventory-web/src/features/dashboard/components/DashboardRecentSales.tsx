import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardRecentSale } from "@/types";

interface DashboardRecentSalesProps {
  sales: DashboardRecentSale[];
  locale: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const paymentStatusColors: Record<string, string> = {
  paid:    "bg-success-100 text-success-700 border-success-200",
  partial: "bg-warning-100 text-warning-700 border-warning-200",
  pending: "bg-surface-hover text-fg-muted border-border",
  overdue: "bg-danger-100  text-danger-700  border-danger-200",
  refunded:"bg-primary-50  text-primary-600 border-primary-100",
};

const PAYMENT_LABELS: Record<string, string> = {
  paid:     "Paid",
  partial:  "Partial",
  pending:  "Pending",
  overdue:  "Overdue",
  refunded: "Refunded",
};

export async function DashboardRecentSales({ sales, locale }: DashboardRecentSalesProps) {
  const t = await getTranslations("dashboard");

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-fg text-sm">{t("recent_sales")}</h3>
        <Link href={`/${locale}/sales`} className="text-xs text-primary-600 hover:underline">
          {t("see_all")}
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="px-5 py-8 text-sm text-fg-muted text-center">{t("no_recent_sales")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {sales.map((sale) => (
            <li key={sale.id}>
              <Link
                href={`/${locale}/sales/${sale.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{sale.sale_number}</p>
                  <p className="text-xs text-fg-muted truncate">
                    {sale.client_name ?? "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-fg tabular-nums">
                    {fmt(sale.total_ttc)} F
                  </p>
                  <span
                    className={cn(
                      "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border",
                      paymentStatusColors[sale.payment_status] ?? "bg-surface-hover text-fg-muted border-border",
                    )}
                  >
                    {PAYMENT_LABELS[sale.payment_status] ?? sale.payment_status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
