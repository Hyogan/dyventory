import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fmtNumber } from "@/features/dashboard/utils";
import type { DashboardRecentSale } from "@/types";

interface DashboardRecentSalesProps {
  sales: DashboardRecentSale[];
  locale: string;
}

/** Returns initials from a full name (up to 2 chars) */
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const AVATAR_PALETTES = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
];

function clientPalette(name: string): string {
  const hash = name
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export async function DashboardRecentSales({
  sales,
  locale,
}: DashboardRecentSalesProps) {
  const t = await getTranslations("dashboard");

  return (
    <div className="card flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-fg">{t("recent_sales")}</h3>
          <p className="text-xs text-fg-muted mt-0.5">{t("last_transactions")}</p>
        </div>
        <Link
          href={`/${locale}/sales`}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 transition-colors"
        >
          {t("see_all")}
        </Link>
      </div>

      {/* Body */}
      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-5">
          <div className="size-12 rounded-xl bg-surface-muted border border-border flex items-center justify-center">
            <ShoppingCart className="size-5 text-fg-muted opacity-50" />
          </div>
          <p className="text-sm text-fg-muted">{t("no_recent_sales")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sales.map((sale) => {
            const clientName = sale.client_name ?? "Anonymous";
            const hasClient = Boolean(sale.client_name);

            return (
              <li key={sale.id}>
                <Link
                  href={`/${locale}/sales/${sale.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-muted/50 transition-colors group"
                >
                  {/* Client avatar */}
                  {hasClient ? (
                    <div
                      className={cn(
                        "size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border",
                        clientPalette(clientName),
                      )}
                    >
                      {initials(clientName)}
                    </div>
                  ) : (
                    <div className="size-9 rounded-full bg-surface-muted border border-border flex items-center justify-center shrink-0">
                      <ShoppingCart className="size-4 text-fg-muted" />
                    </div>
                  )}

                  {/* Sale info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate group-hover:text-primary-600 transition-colors">
                      {clientName}
                    </p>
                    <p className="text-xs text-fg-muted truncate">
                      {sale.sale_number}
                    </p>
                  </div>

                  {/* Right side: amount + badge */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-fg tabular-nums">
                      {fmtNumber(sale.total_ttc, locale)} F
                    </span>
                    <StatusBadge status={sale.payment_status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
