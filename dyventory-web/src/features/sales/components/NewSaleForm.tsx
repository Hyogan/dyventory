"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SaleCart } from "./SaleCart";
import { ClientSelector } from "./ClientSelector";
import { PaymentSection } from "./PaymentSection";
import { OrderSummary } from "./OrderSummary";
import { createSale } from "../actions";
import { useSaleStore, selectCartTotals } from "@/stores/useSaleStore";

export function NewSaleForm() {
  const t = useTranslations("sales");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const items = useSaleStore((s) => s.items);
  const clientId = useSaleStore((s) => s.clientId);
  const paymentMethod = useSaleStore((s) => s.paymentMethod);
  const dueDate = useSaleStore((s) => s.dueDate);
  const globalDiscount = useSaleStore((s) => s.globalDiscount);
  const notes = useSaleStore((s) => s.notes);
  const clearCart = useSaleStore((s) => s.clearCart);

  const { totalTtc } = selectCartTotals(items, globalDiscount);

  const validate = () => {
    if (items.length === 0) {
      setError("Add at least one product to the cart before confirming.");
      return false;
    }
    if (paymentMethod === "credit" && !dueDate) {
      setError("A due date is required for credit sales.");
      return false;
    }
    return true;
  };

  const submit = (status: "draft" | "confirmed") => {
    setError(null);
    setFieldErrors({});

    if (!validate()) return;

    const payload = {
      client_id: clientId,
      payment_method: paymentMethod,
      due_date: dueDate || undefined,
      discount_amount: globalDiscount || undefined,
      notes: notes || undefined,
      status,
      items: items.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant_id ?? undefined,
        quantity: item.quantity,
        discount_percent: item.discount_percent || undefined,
      })),
    };

    startTransition(async () => {
      const result = await createSale(payload);
      if (result.success && result.saleId) {
        clearCart();
        router.push(`/${locale}/sales/${result.saleId}`);
      } else {
        setError(result.message ?? "An error occurred.");
        if (result.errors) setFieldErrors(result.errors);
      }
    });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* ── LEFT PANEL — Cart ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 card p-5 flex flex-col overflow-hidden">
        <h2 className="text-sm font-semibold text-fg mb-4 shrink-0">
          {t("cart.title")}
          {items.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center size-5 rounded-full bg-primary-500 text-white text-[10px] font-bold">
              {items.length}
            </span>
          )}
        </h2>
        <SaleCart />
      </div>

      {/* ── RIGHT PANEL — Summary + actions ──────────────────────────────────── */}
      <div className="w-80 xl:w-96 shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-thin pb-1">
        {/* Client selector */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">
            {t("fields.client")}
          </p>
          <ClientSelector />
        </div>

        {/* Payment method */}
        <div className="card p-4">
          <PaymentSection />
        </div>

        {/* Order summary */}
        <div className="card p-4">
          <p className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">
            {t("new.order_summary")}
          </p>
          <OrderSummary />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {Object.keys(fieldErrors).length > 0 && (
          <ul className="px-3 py-2.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-xs space-y-1">
            {Object.entries(fieldErrors).flatMap(([key, msgs]) =>
              msgs.map((msg, i) => (
                <li key={`${key}-${i}`}>· {msg}</li>
              )),
            )}
          </ul>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => submit("confirmed")}
            loading={isPending}
            disabled={items.length === 0}
            icon={<CheckCircle2 className="size-4" />}
            size="lg"
            className="w-full justify-center"
          >
            {t("new.confirm_sale")}
          </Button>

          <Button
            onClick={() => submit("draft")}
            loading={isPending}
            disabled={items.length === 0}
            variant="outline"
            icon={<FileText className="size-4" />}
            size="md"
            className="w-full justify-center"
          >
            {t("new.save_draft")}
          </Button>
        </div>

        <p className="text-xs text-fg-muted text-center pb-4">
          Confirming will immediately decrement stock (FEFO).
        </p>
      </div>
    </div>
  );
}
