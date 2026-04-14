"use client";

import { useEffect, useState, useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BatchFieldsSection } from "./BatchFieldsSection";
import { createBatch } from "../actions";
import type { Product } from "@/types";
import type { FieldDefinition } from "@/types/field-schema";
import { cn } from "@/lib/utils";

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  product_id: z.coerce.number().min(1, "Product is required"),
  variant_id: z.coerce.number().optional(),
  batch_number: z.string().optional(),
  received_at: z.string().optional(),
  initial_quantity: z.coerce.number().min(0.001, "Quantity must be positive"),
  supplier_id: z.coerce.number().optional(),
  type: z.string().default("in_purchase"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface StockEntryFormProps {
  products: Product[];
  preselectedProductId?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StockEntryForm({ products, preselectedProductId }: StockEntryFormProps) {
  const t = useTranslations();
  const router = useRouter();

  const [state, action, isPending] = useActionState(createBatch, {
    success: false,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: preselectedProductId ?? 0,
      type: "in_purchase",
    },
  });

  const selectedProductId = watch("product_id");
  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  // Batch-level dynamic fields from category schema
  const batchFields: FieldDefinition[] = (
    (selectedProduct?.category?.field_schema ?? []) as FieldDefinition[]
  ).filter((f) => f.applies_to === "batch");

  const isKg = selectedProduct?.unit_of_measure === "kg";

  // Redirect on success
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
    if (values.batch_number) fd.set("batch_number", values.batch_number);
    if (values.received_at) fd.set("received_at", values.received_at);
    fd.set("initial_quantity", String(values.initial_quantity));
    if (values.notes) fd.set("notes", values.notes);

    // Collect dynamic batch attributes from form DOM
    const attrFields = batchFields.map((f) => f.key);
    const attributes: Record<string, unknown> = {};
    const form = document.getElementById("stock-entry-form") as HTMLFormElement | null;
    if (form) {
      for (const key of attrFields) {
        const el = form.elements.namedItem(`attributes.${key}`) as HTMLInputElement | null;
        if (el) attributes[key] = el.type === "checkbox" ? el.checked : el.value;
      }
    }
    fd.set("attributes", JSON.stringify(attributes));

    startTransition(() => action(fd));
  };

  return (
    <form id="stock-entry-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      {/* Global error */}
      {!state.success && state.message && (
        <div className="rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
          {state.message}
        </div>
      )}

      {/* Section: Product */}
      <Card>
        <CardHeader>
          <CardTitle>Product &amp; Movement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product select */}
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
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="mt-1 text-xs text-danger-600">{errors.product_id.message}</p>
            )}
          </div>

          {/* Movement type */}
          <div>
            <label className="block text-sm font-medium text-fg mb-1">
              {t("stock.fields.movement_type")}
            </label>
            <select
              {...register("type")}
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="in_purchase">{t("stock.movement_types.in_purchase")}</option>
              <option value="in_return">{t("stock.movement_types.in_return")}</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-fg mb-1">
              {isKg ? t("stock.fields.quantity_kg") : t("stock.fields.quantity")}{" "}
              <span className="text-danger-500">*</span>
            </label>
            <Input
              {...register("initial_quantity", { valueAsNumber: true })}
              type="number"
              step={isKg ? "0.001" : "1"}
              min="0.001"
              placeholder={isKg ? "0.000" : "0"}
              error={errors.initial_quantity?.message}
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

      {/* Section: Batch */}
      <Card>
        <CardHeader>
          <CardTitle>{t("stock.fields.batch")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                Batch number
              </label>
              <Input
                {...register("batch_number")}
                placeholder="LOT-20260411-XXXX (auto-generated)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                Received date
              </label>
              <Input
                {...register("received_at")}
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Dynamic batch fields */}
      {batchFields.length > 0 && (
        <BatchFieldsSection
          batchFields={batchFields}
          register={register as unknown as Parameters<typeof BatchFieldsSection>[0]["register"]}
          control={control}
          errors={errors}
        />
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending} icon={isPending ? <Loader2 className="size-4 animate-spin" /> : undefined}>
          {isPending ? t("common.loading") : t("stock.entry.title")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
