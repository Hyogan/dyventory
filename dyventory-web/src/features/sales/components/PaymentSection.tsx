"use client";

import { useTranslations } from "next-intl";
import { Banknote, Smartphone, Building2, CreditCard } from "lucide-react";
import { useSaleStore, type PaymentMethod } from "@/stores/useSaleStore";
import { cn } from "@/lib/utils";

const METHODS: {
  value: PaymentMethod;
  icon: React.ReactNode;
  labelKey: string;
  color: string;
}[] = [
  {
    value: "cash",
    icon: <Banknote className="size-5" />,
    labelKey: "cash",
    color: "text-success-600 border-success-200 bg-success-50",
  },
  {
    value: "mobile_money",
    icon: <Smartphone className="size-5" />,
    labelKey: "mobile_money",
    color: "text-primary-600 border-primary-200 bg-primary-50",
  },
  {
    value: "bank_transfer",
    icon: <Building2 className="size-5" />,
    labelKey: "bank_transfer",
    color: "text-secondary-600 border-secondary-200 bg-secondary-50",
  },
  {
    value: "credit",
    icon: <CreditCard className="size-5" />,
    labelKey: "credit",
    color: "text-warning-600 border-warning-200 bg-warning-50",
  },
];

export function PaymentSection() {
  const t = useTranslations("sales");
  const paymentMethod = useSaleStore((s) => s.paymentMethod);
  const setPaymentMethod = useSaleStore((s) => s.setPaymentMethod);
  const dueDate = useSaleStore((s) => s.dueDate);
  const setDueDate = useSaleStore((s) => s.setDueDate);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">
        {t("fields.payment_method")}
      </p>

      {/* Method selector */}
      <div className="grid grid-cols-2 gap-2">
        {METHODS.map((m) => {
          const isActive = paymentMethod === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setPaymentMethod(m.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                isActive
                  ? m.color + " ring-2 ring-offset-1 ring-current/20"
                  : "border-border text-fg-subtle hover:border-border-strong hover:bg-surface-hover",
              )}
            >
              <span className={isActive ? "" : "text-fg-muted"}>{m.icon}</span>
              <span className="truncate">{t(`payment_methods.${m.labelKey}`)}</span>
            </button>
          );
        })}
      </div>

      {/* Due date — only for credit */}
      {paymentMethod === "credit" && (
        <div className="space-y-1.5">
          <label className="label" htmlFor="due-date">
            {t("fields.due_date")}
            <span className="text-danger-500 ml-0.5">*</span>
          </label>
          <input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input"
            min={new Date().toISOString().split("T")[0]}
          />
          <p className="text-xs text-fg-muted">{t("new.due_date_hint")}</p>
        </div>
      )}
    </div>
  );
}
