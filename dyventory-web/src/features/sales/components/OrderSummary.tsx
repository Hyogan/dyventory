"use client";

import { useTranslations } from "next-intl";
import { useSaleStore, selectCartTotals } from "@/stores/useSaleStore";

const OPTIONAL_LABEL = "(optional)";

function fmt(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function OrderSummary() {
  const t = useTranslations("sales");
  const items = useSaleStore((s) => s.items);
  const globalDiscount = useSaleStore((s) => s.globalDiscount);
  const setGlobalDiscount = useSaleStore((s) => s.setGlobalDiscount);
  const notes = useSaleStore((s) => s.notes);
  const setNotes = useSaleStore((s) => s.setNotes);

  const { rawTtc, discount, totalTtc } = selectCartTotals(items, globalDiscount);

  return (
    <div className="space-y-4">
      {/* Totals breakdown */}
      <div className="rounded-xl border border-border bg-surface-muted/40 overflow-hidden">
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg-muted">{t("fields.subtotal")}</span>
            <span className="tabular-nums font-medium text-fg">{fmt(rawTtc)} F</span>
          </div>

          {/* Global discount */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-muted shrink-0">{t("new.discount_amount")}</span>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-fg-muted text-sm">−</span>
              <input
                type="number"
                value={globalDiscount || ""}
                min={0}
                max={rawTtc}
                step={100}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-24 text-right text-sm border border-border rounded-md h-7 bg-surface-card px-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 tabular-nums"
                aria-label="Global discount"
              />
              <span className="text-fg-muted text-xs">F</span>
            </div>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-muted">{t("fields.discount")}</span>
              <span className="tabular-nums text-success-600">−{fmt(discount)} F</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="px-4 py-3 bg-primary-500 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">{t("fields.total")}</span>
          <span className="text-lg font-bold text-white tabular-nums">
            {fmt(totalTtc)} <span className="text-sm font-normal opacity-80">F</span>
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="label" htmlFor="sale-notes">
          {t("fields.notes")}
          <span className="ml-1 text-fg-muted font-normal">{OPTIONAL_LABEL}</span>
        </label>
        <textarea
          id="sale-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Internal notes about this sale…"
          className="input-textarea text-sm resize-none"
        />
      </div>
    </div>
  );
}
