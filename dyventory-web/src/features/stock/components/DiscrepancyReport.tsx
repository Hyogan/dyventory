"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { DiscrepancyItem } from "../actions";
import { validateInventorySession, cancelInventorySession } from "../actions";
import { cn } from "@/lib/utils";

interface DiscrepancyReportProps {
  sessionId: number;
  discrepancies: DiscrepancyItem[];
  onComplete: () => void;
}

export function DiscrepancyReport({
  sessionId,
  discrepancies,
  onComplete,
}: DiscrepancyReportProps) {
  const t = useTranslations();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleValidate = () => {
    startTransition(async () => {
      const result = await validateInventorySession(sessionId);
      if (result.success) {
        onComplete();
      } else {
        setError(result.message ?? "An error occurred.");
      }
      setConfirmOpen(false);
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      await cancelInventorySession(sessionId);
      onComplete();
      setCancelOpen(false);
    });
  };

  if (discrepancies.length === 0) {
    return (
      <div className="rounded-xl border border-success-200 bg-success-50 px-6 py-8 text-center space-y-3">
        <CheckCircle2 className="size-10 text-success-500 mx-auto" />
        <p className="font-semibold text-fg">Stock counts match perfectly.</p>
        <p className="text-sm text-fg-muted">
          No discrepancies found. You can validate to complete the session.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => setConfirmOpen(true)} disabled={isPending}>
            {t("stock.inventory.confirm")}
          </Button>
          <Button variant="ghost" onClick={() => setCancelOpen(true)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700 mb-4">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning-500" />
            <h3 className="font-semibold text-fg">{t("stock.inventory.discrepancy")}</h3>
          </div>
          <span className="text-sm text-fg-muted">
            {discrepancies.length} discrepanc{discrepancies.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-fg-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Product / Batch</th>
              <th className="text-right px-4 py-2">System qty</th>
              <th className="text-right px-4 py-2">Counted qty</th>
              <th className="text-right px-4 py-2">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {discrepancies.map((item) => (
              <tr key={item.batch_id} className="hover:bg-surface-muted/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-fg">{item.product_name}</p>
                  <p className="text-xs text-fg-muted font-mono">{item.batch_number}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-fg-subtle">
                  {item.snapshot_quantity.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-fg">
                  {item.counted_quantity.toFixed(3)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right tabular-nums font-medium",
                    item.delta > 0 ? "text-success-600" : "text-danger-600",
                  )}
                >
                  {item.delta > 0 ? "+" : ""}
                  {item.delta.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-4 border-t border-border flex items-center gap-3">
          <Button onClick={() => setConfirmOpen(true)} disabled={isPending}>
            {t("stock.inventory.confirm")}
          </Button>
          <Button variant="ghost" onClick={() => setCancelOpen(true)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>

      {/* Confirm validate */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleValidate}
        title={t("stock.inventory.confirm")}
        description="This will apply stock adjustments for all discrepancies and complete the session."
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        variant="primary"
      />

      {/* Confirm cancel */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Session"
        description="Are you sure you want to cancel this inventory session? No adjustments will be made."
        confirmLabel="Cancel Session"
        cancelLabel={t("common.back")}
        variant="danger"
      />
    </>
  );
}
