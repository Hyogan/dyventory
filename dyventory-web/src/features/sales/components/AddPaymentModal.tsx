"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Banknote, Smartphone, Building2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { recordPayment } from "../actions";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types";

interface AddPaymentModalProps {
  sale: Sale;
  open: boolean;
  onClose: () => void;
}

const METHODS = [
  { value: "cash", label: "Cash", icon: <Banknote className="size-4" /> },
  { value: "mobile_money", label: "Mobile Money", icon: <Smartphone className="size-4" /> },
  { value: "bank_transfer", label: "Bank Transfer", icon: <Building2 className="size-4" /> },
];

export function AddPaymentModal({ sale, open, onClose }: AddPaymentModalProps) {
  const t = useTranslations("sales");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState(parseFloat(sale.amount_due).toFixed(2));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const maxAmount = parseFloat(sale.amount_due);

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (amountNum > maxAmount + 0.01) {
      setError(`Amount cannot exceed ${maxAmount.toLocaleString("fr-FR")} F (balance due).`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await recordPayment(sale.id, {
        amount: amountNum,
        payment_method: method,
        reference: reference || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.message ?? "An error occurred.");
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("actions.add_payment")}
      description={`Sale ${sale.sale_number} · Balance: ${maxAmount.toLocaleString("fr-FR")} F`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            Record payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Payment method */}
        <div className="space-y-2">
          <label className="label">Payment method</label>
          <div className="flex gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-medium transition-all",
                  method === m.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-border text-fg-muted hover:border-border-strong",
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="label" htmlFor="payment-amount">
            Amount (F)
          </label>
          <input
            id="payment-amount"
            type="number"
            value={amount}
            min={0.01}
            max={maxAmount}
            step={0.01}
            onChange={(e) => setAmount(e.target.value)}
            className="input tabular-nums text-right text-base font-semibold"
          />
          <p className="text-xs text-fg-muted">
            Max: {maxAmount.toLocaleString("fr-FR")} F
          </p>
        </div>

        {/* Reference */}
        <div className="space-y-1.5">
          <label className="label" htmlFor="payment-ref">
            Reference <span className="text-fg-muted font-normal">(optional)</span>
          </label>
          <input
            id="payment-ref"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction ID, receipt #…"
            className="input"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
