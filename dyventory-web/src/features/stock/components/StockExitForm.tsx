"use client";

import { useEffect, useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LossReasonSelect } from "./LossReasonSelect";
import { recordStockExit } from "../actions";
import type { Product, Batch } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  product_id: z.coerce.number().min(1, "Product is required"),
  variant_id: z.coerce.number().optional(),
  batch_id: z.coerce.number().optional(),
  quantity: z.coerce.number().min(0.001, "Quantity must be positive"),
  type: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StockExitFormProps {
  products: Product[];
  preselectedBatchId?: number;
}

export function StockExitForm({ products, preselectedBatchId }: StockExitFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFd, setPendingFd] = useState<FormData | null>(null);

  const [state, action, isPending] = useActionState(recordStockExit, { success: false });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "out_sale",
      batch_id: preselectedBatchId ?? undefined,
    },
  });

  const selectedProductId = watch("product_id");
  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const isKg = selectedProduct?.unit_of_measure === "kg";
  const currentStock = selectedProduct?.current_stock ?? 0;

  useEffect(() => {
    if (state.success) {
      router.push("../stock");
      router.refresh();
    }
  }, [state.success, router]);

  const onSubmit = (values: FormValues) => {
    const fd = new FormData();
    fd.set("product_id", String(values.product_id));
    if (values.variant_id) fd.set("variant_id", String(values.variant_id));
    if (values.batch_id) fd.set("batch_id", String(values.batch_id));
    fd.set("quantity", String(values.quantity));
    fd.set("type", values.type);
    if (values.notes) fd.set("notes", values.notes);

    setPendingFd(fd);
    setShowConfirm(true);
  };

  const confirmExit = () => {
    if (pendingFd) startTransition(() => action(pendingFd!));
    setShowConfirm(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
        {!state.success && state.message && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {state.message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Product &amp; Exit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                {t("stock.fields.product")} <span className="text-danger-500">*</span>
              </label>
              <select
                {...register("product_id", { valueAsNumber: true })}
                className={cn(
                  "w-full h-10 rounded-lg border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500",
                  errors.product_id ? "border-danger-400" : "border-border",
                )}
              >
                <option value={0}>— Select a product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — stock: {Number(p.current_stock ?? 0).toFixed(p.unit_of_measure === "kg" ? 3 : 0)} {p.unit_of_measure}
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <p className="mt-1 text-xs text-danger-600">{errors.product_id.message}</p>
              )}

              {/* FEFO notice */}
              {selectedProduct && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-fg-muted">
                  <Info className="size-3.5 mt-0.5 shrink-0" />
                  <span>
                    Leave batch blank for automatic FEFO allocation (nearest expiry first).
                    Current stock: <strong className="text-fg">{Number(currentStock).toFixed(isKg ? 3 : 0)} {selectedProduct.unit_of_measure}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Exit reason */}
            <LossReasonSelect
              register={register as unknown as Parameters<typeof LossReasonSelect>[0]["register"]}
              error={errors.type?.message}
            />

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                {isKg ? t("stock.fields.quantity_kg") : t("stock.fields.quantity")}{" "}
                <span className="text-danger-500">*</span>
              </label>
              <Input
                {...register("quantity", { valueAsNumber: true })}
                type="number"
                step={isKg ? "0.001" : "1"}
                min="0.001"
                placeholder={isKg ? "0.000" : "0"}
                error={errors.quantity?.message}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                {t("common.notes")}
              </label>
              <textarea
                {...register("notes")}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Optional notes…"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            variant="danger"
            disabled={isPending}
            icon={isPending ? <Loader2 className="size-4 animate-spin" /> : undefined}
          >
            {isPending ? t("common.loading") : t("stock.exit.title")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmExit}
        title={t("stock.exit.title")}
        description="Are you sure you want to record this stock exit? This action cannot be undone."
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        variant="danger"
      />
    </>
  );
}
