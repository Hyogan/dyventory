import { getTranslations } from "next-intl/server";
import type { TvaReportSummary, TvaReportPeriodRow, TvaReportRateRow } from "@/types";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ── Summary cards ─────────────────────────────────────────────────────────────

export async function TvaSummaryCards({ summary }: { summary: TvaReportSummary }) {
  const t = await getTranslations("reports.summary");

  const cards = [
    { label: t("sale_count"),  value: String(summary.sale_count) },
    { label: t("total_ht"),    value: `${fmt(summary.total_ht)} F` },
    { label: t("total_tva"),   value: `${fmt(summary.total_tva)} F` },
    { label: t("total_ttc"),   value: `${fmt(summary.total_ttc)} F` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

export async function TvaByPeriodTable({ rows }: { rows: TvaReportPeriodRow[] }) {
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
            {[t("period"), t("sales"), t("ht"), t("tva"), t("ttc")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
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
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.total_ht)} F</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-violet-700">{fmt(r.total_tva)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.total_ttc)} F</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── By rate ───────────────────────────────────────────────────────────────────

export async function TvaByRateTable({ rows }: { rows: TvaReportRateRow[] }) {
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
            {[t("rate"), t("sales"), t("ht"), t("tva"), t("ttc")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.vat_rate_id ?? `novat-${i}`} className="hover:bg-surface-hover transition-colors">
              <td className="px-4 py-2.5 font-medium text-fg">
                {r.vat_rate_name}
                <span className="ml-1 text-xs text-fg-muted">({(r.rate * 100).toFixed(1)}%)</span>
              </td>
              <td className="px-4 py-2.5 tabular-nums">{r.sale_count}</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.total_ht)} F</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-violet-700">{fmt(r.total_tva)} F</td>
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.total_ttc)} F</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
