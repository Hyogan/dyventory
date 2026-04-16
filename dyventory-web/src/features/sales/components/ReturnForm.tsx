"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { RotateCcw, AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { processReturn } from "../actions";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types";

interface ReturnFormProps {
  sale: Sale;
}

interface ReturnItem {
  product_id: number;
  quantity: number;
  name: string;
  unit: string;
  maxQty: number;
  selected: boolean;
}

type Resolution = "refund" | "credit_note" | "exchange";

const RESOLUTIONS: { value: Resolution; labelKey: string; description: string }[] = [
  {
    value: "refund",
    labelKey: "resolutions.refund",
    description: "Return money to the client",
  },
  {
    value: "credit_note",
    labelKey: "resolutions.credit_note",
    description: "Issue a credit note for future purchases",
  },
  {
    value: "exchange",
    labelKey: "resolutions.exchange",
    description: "Exchange for other goods",
  },
];

export function ReturnForm({ sale }: ReturnFormProps) {
  const t = useTranslations("sales.return");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>("refund");
  const [restock, setRestock] = useState(true);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const [returnItems, setReturnItems] = useState<ReturnItem[]>(
    (sale.items ?? []).map((item) => ({
      product_id: item.product_id,
      quantity: parseFloat(item.quantity),
      name: item.product?.name ?? `Product #${item.product_id}`,
      unit: item.product?.unit_of_measure ?? "pcs",
      maxQty: parseFloat(item.quantity),
      selected: true,
    })),
  );

  const toggleItem = (idx: number) => {
    setReturnItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, selected: !it.selected } : it)),
    );
  };

  const updateQty = (idx: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? { ...it, quantity: Math.min(Math.max(0.001, qty), it.maxQty) }
          : it,
      ),
    );
  };

  const selectedItems = returnItems.filter((it) => it.selected);

  const handleSubmit = () => {
    setError(null);

    if (!reason.trim()) {
      setError("Please provide a reason for the return.");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Select at least one item to return.");
      return;
    }
    if (resolution === "refund" && !refundAmount) {
      setError("Please specify the refund amount.");
      return;
    }

    startTransition(async () => {
      const result = await processReturn(sale.id, {
        reason: reason.trim(),
        resolution,
        refund_amount: refundAmount ? parseFloat(refundAmount) : undefined,
        restock,
        notes: notes.trim() || undefined,
        items: selectedItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
        })),
      });

      if (result.success) {
        router.push(`/${locale}/sales/${sale.id}`);
      } else {
        setError(result.message ?? "An error occurred.");
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Items to return */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-surface-muted/40">
          <h3 className="text-sm font-semibold text-fg">{t("items_title")}</h3>
        </div>
        <ul className="divide-y divide-border">
          {returnItems.map((item, idx) => (
            <li
              key={item.product_id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                item.selected ? "bg-surface-card" : "bg-surface-muted/30",
              )}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleItem(idx)}
                className="size-4 rounded border-border text-primary-500 accent-primary-500"
                id={`item-${idx}`}
              />

              {/* Product info */}
              <label
                htmlFor={`item-${idx}`}
                className={cn(
                  "flex items-center gap-3 flex-1 min-w-0 cursor-pointer",
                  !item.selected && "opacity-50",
                )}
              >
                <div className="size-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                  <Package className="size-3.5 text-fg-muted" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{item.name}</p>
                  <p className="text-xs text-fg-muted">
                    Sold: {item.maxQty} {item.unit}
                  </p>
                </div>
              </label>

              {/* Quantity input */}
              <div className={cn("flex items-center gap-1.5 shrink-0", !item.selected && "opacity-40 pointer-events-none")}>
                <input
                  type="number"
                  value={item.quantity}
                  min={0.001}
                  max={item.maxQty}
                  step={item.unit === "kg" ? 0.1 : 1}
                  onChange={(e) => updateQty(idx, parseFloat(e.target.value) || 0)}
                  disabled={!item.selected}
                  className="w-20 text-center text-sm border border-border rounded-md h-8 bg-surface-card tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <span className="text-xs text-fg-muted">{item.unit}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Resolution */}
      <div className="card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-fg">{t("resolution")}</h3>
        <div className="space-y-2">
          {RESOLUTIONS.map((r) => (
            <label
              key={r.value}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                resolution === r.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-border hover:border-border-strong",
              )}
            >
              <input
                type="radio"
                name="resolution"
                value={r.value}
                checked={resolution === r.value}
                onChange={() => setResolution(r.value)}
                className="mt-0.5 accent-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-fg">{t(r.labelKey)}</p>
                <p className="text-xs text-fg-muted">{r.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Refund amount — only for refund resolution */}
        {resolution === "refund" && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <label className="label" htmlFor="refund-amount">
              {t("refund_amount")}
              <span className="text-danger-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <input
                id="refund-amount"
                type="number"
                value={refundAmount}
                min={0}
                max={parseFloat(sale.total_ttc)}
                step={0.01}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                className="input tabular-nums pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted text-sm">
                F
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reason + options */}
      <div className="card p-5 space-y-4">
        {/* Reason */}
        <div className="space-y-1.5">
          <label className="label" htmlFor="return-reason">
            {t("reason")}
            <span className="text-danger-500 ml-0.5">*</span>
          </label>
          <textarea
            id="return-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Defective product, wrong item delivered, client changed mind…"
            className="input-textarea resize-none"
          />
        </div>

        {/* Restock toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 rounded-full border border-border bg-surface-muted peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all" />
            <div className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-all peer-checked:translate-x-[18px]" />
          </div>
          <div>
            <p className="text-sm font-medium text-fg">{t("restock")}</p>
            <p className="text-xs text-fg-muted">Creates a stock entry for returned items</p>
          </div>
        </label>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="label" htmlFor="return-notes">
            {t("notes")}
            <span className="text-fg-muted font-normal ml-1">(optional)</span>
          </label>
          <textarea
            id="return-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Internal notes…"
            className="input-textarea resize-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSubmit}
          loading={isPending}
          icon={<RotateCcw className="size-4" />}
        >
          {t("submit")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/sales/${sale.id}`)}
          disabled={isPending}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </div>
  );
}
