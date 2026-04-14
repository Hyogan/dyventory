"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ScanLine, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DiscrepancyReport } from "./DiscrepancyReport";
import {
  submitInventoryCounts,
  getInventoryDiscrepancies,
  type InventorySession,
  type DiscrepancyItem,
} from "../actions";

interface InventoryCountFormProps {
  session: InventorySession;
  onComplete: () => void;
}

type BatchEntry = {
  key: string;
  batch_id: number;
  product_name: string;
  batch_number: string;
  system_quantity: number;
  counted_quantity: string;
};

export function InventoryCountForm({ session, onComplete }: InventoryCountFormProps) {
  const t = useTranslations("stock");

  // Build editable rows from snapshot
  const [entries, setEntries] = useState<BatchEntry[]>(() =>
    Object.entries(session.snapshot ?? {}).map(([key, snap]) => ({
      key,
      batch_id: snap.batch_id,
      product_name: snap.product_name,
      batch_number: snap.batch_number,
      system_quantity: snap.quantity,
      counted_quantity: String(snap.quantity), // default to system qty
    })),
  );

  const [step, setStep] = useState<"count" | "review">("count");
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Scanner: auto-focus next input when Enter is pressed
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateQty = (idx: number, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, counted_quantity: value } : e)),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
    }
  };

  const handleReview = () => {
    startTransition(async () => {
      const counts = entries.map((e) => ({
        batch_id: e.batch_id,
        counted_quantity: parseFloat(e.counted_quantity) || 0,
      }));

      const submitResult = await submitInventoryCounts(session.id, counts);
      if (!submitResult.success) {
        setError(submitResult.message ?? "Failed to save counts.");
        return;
      }

      const items = await getInventoryDiscrepancies(session.id);
      setDiscrepancies(items);
      setStep("review");
      setError(null);
    });
  };

  if (step === "review") {
    return (
      <DiscrepancyReport
        sessionId={session.id}
        discrepancies={discrepancies}
        onComplete={onComplete}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {error && (
        <div className="rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-fg-muted mb-2">
        <ScanLine className="size-4" />
        <span>Use a barcode scanner or manually enter counts. Press Enter to advance to the next row.</span>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-fg-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Product / Batch</th>
              <th className="text-right px-4 py-2">System qty</th>
              <th className="text-right px-4 py-2 w-40">Physical count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry, idx) => (
              <tr key={entry.key} className="hover:bg-surface-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-fg">{entry.product_name}</p>
                  <p className="text-xs text-fg-muted font-mono">{entry.batch_number}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-fg-subtle">
                  {entry.system_quantity.toFixed(3)}
                </td>
                <td className="px-4 py-3">
                  <input
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="number"
                    step="0.001"
                    min="0"
                    value={entry.counted_quantity}
                    onChange={(e) => updateQty(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-full h-8 rounded-md border border-border bg-surface px-2 text-sm text-right text-fg tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleReview}
          disabled={isPending}
          icon={
            isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )
          }
        >
          {isPending ? "Loading…" : "Review discrepancies"}
        </Button>
      </div>
    </div>
  );
}
