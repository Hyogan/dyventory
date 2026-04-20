import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { CreditReportSummary, CreditReportClientRow, OverdueInvoice } from "@/types";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ── Summary cards ─────────────────────────────────────────────────────────────

export async function CreditSummaryCards({ summary }: { summary: CreditReportSummary }) {
  const t = await getTranslations("reports.summary");

  const cards = [
    { label: t("sale_count"),        value: String(summary.sale_count),                     danger: false },
    { label: t("total_invoiced"),    value: `${fmt(summary.total_invoiced)} F`,              danger: false },
    { label: t("total_collected"),   value: `${fmt(summary.total_collected)} F`,             danger: false },
    { label: t("total_outstanding"), value: `${fmt(summary.total_outstanding)} F`,           danger: summary.total_outstanding > 0 },
    { label: t("total_overdue"),     value: `${fmt(summary.total_overdue)} F`,               danger: summary.total_overdue > 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={cn("rounded-lg border p-3", c.danger ? "border-danger-200 bg-danger-50" : "border-border bg-surface")}>
          <p className="text-[11px] font-medium text-fg-muted uppercase tracking-wide">{c.label}</p>
          <p className={cn("text-base font-bold mt-1 tabular-nums", c.danger ? "text-danger-700" : "text-fg")}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Outstanding by client ─────────────────────────────────────────────────────

export async function OutstandingByClientTable({ rows }: { rows: CreditReportClientRow[] }) {
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
            {[t("client"), t("sales"), t("total"), t("outstanding"), t("overdue")].map((h) => (
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
              <td className="px-4 py-2.5 tabular-nums">{fmt(r.total_invoiced)} F</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-warning-700">
                {r.outstanding > 0 ? `${fmt(r.outstanding)} F` : "—"}
              </td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-danger-700">
                {r.overdue > 0 ? `${fmt(r.overdue)} F` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Overdue invoices ──────────────────────────────────────────────────────────

export async function OverdueInvoicesTable({ rows }: { rows: OverdueInvoice[] }) {
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
            {[t("sale_number"), t("client"), t("due_date"), t("amount_due"), t("days_overdue")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-surface-hover transition-colors">
              <td className="px-4 py-2.5 font-mono font-medium text-fg text-xs">{r.sale_number}</td>
              <td className="px-4 py-2.5 text-fg">{r.client_name}</td>
              <td className="px-4 py-2.5 text-fg-muted">{r.due_date?.slice(0, 10)}</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-danger-700">{fmt(r.amount_due)} F</td>
              <td className="px-4 py-2.5">
                <span className={cn(
                  "inline-block px-1.5 py-0.5 rounded text-xs font-medium border",
                  r.days_overdue > 30
                    ? "bg-danger-100 text-danger-700 border-danger-200"
                    : "bg-warning-100 text-warning-700 border-warning-200",
                )}>
                  {r.days_overdue}d
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
