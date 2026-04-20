import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { StockValueCategoryRow, StockForecastRow } from "@/types";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function fmtDec(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ── Value by category ─────────────────────────────────────────────────────────

export async function StockValueByCategoryTable({ rows }: { rows: StockValueCategoryRow[] }) {
  const t  = await getTranslations("reports.cols");
  const tc = await getTranslations("common");

  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted text-center py-8">{tc("noData")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[t("category"), t("products"), t("qty_sold"), t("value_ht"), t("value_ttc")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.category_id} className="hover:bg-surface-hover transition-colors">
              <td className="px-4 py-2.5 font-medium text-fg">{r.category_name}</td>
              <td className="px-4 py-2.5 tabular-nums text-fg-muted">{r.product_count}</td>
              <td className="px-4 py-2.5 tabular-nums text-fg-muted">{fmtDec(r.total_quantity)}</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.value_ht)} F</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-fg">{fmt(r.value_ttc)} F</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Stock forecast ────────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<string, string> = {
  critical: "bg-danger-100 text-danger-700 border-danger-200",
  warning:  "bg-warning-100 text-warning-700 border-warning-200",
  ok:       "bg-success-50 text-success-700 border-success-100",
};

export async function StockForecastTable({ rows }: { rows: StockForecastRow[] }) {
  const t  = await getTranslations("reports");
  const tc = await getTranslations("common");
  const tu = await getTranslations("reports.urgency");

  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted text-center py-8">{tc("noData")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[
              t("cols.product"),
              t("cols.sku"),
              t("cols.current_stock"),
              t("cols.avg_daily"),
              t("cols.days_left"),
              t("cols.urgency"),
            ].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-surface-hover transition-colors">
              <td className="px-4 py-2.5 font-medium text-fg max-w-[12rem] truncate">{r.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-fg-muted">{r.sku}</td>
              <td className="px-4 py-2.5 tabular-nums">{fmtDec(r.current_stock)} {r.unit}</td>
              <td className="px-4 py-2.5 tabular-nums text-fg-muted">{fmtDec(r.avg_daily_consumption)}</td>
              <td className="px-4 py-2.5 tabular-nums">
                {r.days_to_stockout !== null ? `${r.days_to_stockout}j` : "∞"}
              </td>
              <td className="px-4 py-2.5">
                <span className={cn(
                  "inline-block px-1.5 py-0.5 rounded text-xs font-medium border",
                  URGENCY_STYLES[r.urgency] ?? URGENCY_STYLES.ok,
                )}>
                  {tu(r.urgency)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
