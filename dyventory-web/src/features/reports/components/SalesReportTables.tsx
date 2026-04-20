import { getTranslations } from "next-intl/server";
import type {
  SalesReportSummary,
  SalesReportPeriodRow,
  SalesReportVendorRow,
  SalesReportCategoryRow,
  SalesReportClientRow,
} from "@/types";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function fmtDec(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ── Summary cards ─────────────────────────────────────────────────────────────

export async function SalesSummaryCards({ summary }: { summary: SalesReportSummary }) {
  const t  = await getTranslations("reports.summary");
  const tc = await getTranslations("common");

  const cards = [
    { label: t("sale_count"),        value: String(summary.sale_count) },
    { label: t("revenue_ttc"),       value: `${fmt(summary.revenue_ttc)} F` },
    { label: t("revenue_ht"),        value: `${fmt(summary.revenue_ht)} F` },
    { label: t("total_tva"),         value: `${fmt(summary.total_tva)} F` },
    { label: t("total_discount"),    value: `${fmt(summary.total_discount)} F` },
    { label: t("total_outstanding"), value: `${fmt(summary.total_outstanding)} F` },
    { label: t("avg_ticket"),        value: `${fmt(summary.avg_ticket)} F` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-surface p-3">
          <p className="text-[11px] font-medium text-fg-muted uppercase tracking-wide">{c.label}</p>
          <p className="text-base font-bold text-fg mt-1 tabular-nums">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── By period ─────────────────────────────────────────────────────────────────

export async function SalesByPeriodTable({ rows }: { rows: SalesReportPeriodRow[] }) {
  const t = await getTranslations("reports.cols");
  const tc = await getTranslations("common");

  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted text-center py-8">{tc("noData")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[t("period"), t("sales"), t("revenue_ttc"), t("revenue_ht"), t("tva"), t("discount")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide first:rounded-tl last:rounded-tr">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.period} className="hover:bg-surface-hover transition-colors">
              <td className="px-4 py-2.5 font-medium text-fg">{r.period?.slice(0, 10)}</td>
              <td className="px-4 py-2.5 tabular-nums">{r.sale_count}</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.revenue_ttc)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.revenue_ht)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.total_tva)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.total_discount)} F</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── By vendor ─────────────────────────────────────────────────────────────────

export async function SalesByVendorTable({ rows }: { rows: SalesReportVendorRow[] }) {
  const t = await getTranslations("reports.cols");
  const tc = await getTranslations("common");

  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted text-center py-8">{tc("noData")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[t("vendor"), t("sales"), t("revenue_ttc"), t("avg_ticket")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.user_id} className="hover:bg-surface-hover transition-colors">
              <td className="px-4 py-2.5 font-medium text-fg">{r.user_name}</td>
              <td className="px-4 py-2.5 tabular-nums">{r.sale_count}</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.revenue_ttc)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.avg_ticket)} F</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── By category ───────────────────────────────────────────────────────────────

export async function SalesByCategoryTable({ rows }: { rows: SalesReportCategoryRow[] }) {
  const t = await getTranslations("reports.cols");
  const tc = await getTranslations("common");

  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted text-center py-8">{tc("noData")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[t("category"), t("sales"), t("revenue_ttc"), t("qty_sold")].map((h) => (
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
              <td className="px-4 py-2.5 tabular-nums">{r.sale_count}</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.revenue_ttc)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{fmtDec(r.quantity_sold)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── By client ─────────────────────────────────────────────────────────────────

export async function SalesByClientTable({ rows }: { rows: SalesReportClientRow[] }) {
  const t = await getTranslations("reports.cols");
  const tc = await getTranslations("common");

  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted text-center py-8">{tc("noData")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {[t("client"), t("sales"), t("revenue_ttc"), t("outstanding")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.client_id ?? `anon-${i}`} className="hover:bg-surface-hover transition-colors">
              <td className="px-4 py-2.5 font-medium text-fg">{r.client_name}</td>
              <td className="px-4 py-2.5 tabular-nums">{r.sale_count}</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.revenue_ttc)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{r.outstanding > 0 ? `${fmt(r.outstanding)} F` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
