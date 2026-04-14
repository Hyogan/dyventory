"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ArrowLeft, Layers, PackagePlus } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DynamicFieldRenderer } from "@/components/shared/DynamicFieldRenderer";
import { schemaToZod } from "@/lib/schema-to-zod";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "../actions";
import type { Product, Category, VatRate } from "@/types";
import type { FieldDefinition } from "@/types/field-schema";

// ── Types ───────────────────────────────────────────────────────────────────

type FormValues = {
  name: string;
  sku?: string;
  description?: string;
  category_id: number;
  vat_rate_id: number;
  unit_of_measure: string;
  price_buy_ht: number;
  price_sell_ttc: number;
  barcode?: string;
  stock_alert_threshold: number;
  has_variants: boolean;
  attributes: Record<string, unknown>;
};

// ── Base Zod schema (universal fields) ───────────────────────────────────────

const baseSchema = z.object({
  name: z.string().min(1, "Product name is required.").max(255),
  sku: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  category_id: z.coerce.number().min(1, "Category is required."),
  vat_rate_id: z.coerce.number().min(1, "VAT rate is required."),
  unit_of_measure: z.string().default("piece"),
  price_buy_ht: z.coerce.number().min(0, "Must be 0 or more."),
  price_sell_ttc: z.coerce.number().min(0, "Must be 0 or more."),
  barcode: z.string().max(50).optional().or(z.literal("")),
  stock_alert_threshold: z.coerce.number().min(0).default(0),
  has_variants: z.boolean().default(false),
});

// ── Props ────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  vatRates: VatRate[];
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProductForm({
  product,
  categories,
  vatRates,
}: ProductFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isEdit = !!product;

  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    product?.category_id ?? 0,
  );

  // Get current category and its product-level fields
  const selectedCategory = findCategory(categories, selectedCategoryId);
  const productFields: FieldDefinition[] =
    selectedCategory?.field_schema?.filter((f) => f.applies_to === "product") ??
    [];

  // Build combined Zod schema: base + dynamic fields
  const dynamicSchema = productFields.length
    ? schemaToZod(productFields, "product")
    : z.object({});
  const fullSchema = baseSchema.extend({
    attributes: dynamicSchema,
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(fullSchema) as never,
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      description: product?.description ?? "",
      category_id: product?.category_id ?? 0,
      vat_rate_id:
        product?.vat_rate_id ?? vatRates.find((v) => v.is_default)?.id ?? 0,
      unit_of_measure: product?.unit_of_measure ?? "piece",
      price_buy_ht: Number(product?.price_buy_ht ?? 0),
      price_sell_ttc: Number(product?.price_sell_ttc ?? 0),
      barcode: product?.barcode ?? "",
      stock_alert_threshold: Number(product?.stock_alert_threshold ?? 0),
      has_variants: product?.has_variants ?? false,
      attributes: (product?.attributes ?? {}) as FormValues["attributes"],
    },
  });

  // Server action
  const boundUpdate = isEdit
    ? updateProduct.bind(null, product!.id)
    : undefined;

  const serverAction = isEdit ? boundUpdate! : createProduct;

  const [state, formAction, isPending] = useActionState(serverAction, {
    success: false,
  } as ProductFormState);

  // Redirect on success
  useEffect(() => {
    if (state.success && state.productId) {
      router.push(`/${locale}/products/${state.productId}`);
    }
  }, [state.success, state.productId, router, locale]);

  // Reset dynamic attributes when category changes
  const watchedCategory = watch("category_id");
  useEffect(() => {
    if (watchedCategory !== selectedCategoryId) {
      setSelectedCategoryId(watchedCategory);
      if (!isEdit) {
        setValue("attributes", {} as FormValues["attributes"]);
      }
    }
  }, [watchedCategory, selectedCategoryId, setValue, isEdit]);

  const onSubmit = (data: FormValues) => {
    const formData = new FormData();

    // Universal fields
    formData.set("name", data.name);
    formData.set("category_id", String(data.category_id));
    formData.set("vat_rate_id", String(data.vat_rate_id));
    formData.set("unit_of_measure", data.unit_of_measure);
    formData.set("price_buy_ht", String(data.price_buy_ht));
    formData.set("price_sell_ttc", String(data.price_sell_ttc));
    formData.set("stock_alert_threshold", String(data.stock_alert_threshold));
    formData.set("has_variants", String(data.has_variants));

    if (data.sku) formData.set("sku", data.sku);
    if (data.description) formData.set("description", data.description);
    if (data.barcode) formData.set("barcode", data.barcode);

    // Dynamic attributes as JSON
    formData.set("attributes", JSON.stringify(data.attributes ?? {}));

    startTransition(() => formAction(formData));
  };

  // Flatten categories for select
  const flatCategories = flattenCats(categories);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* Server-side error banner */}
      {state.message && !state.success && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {state.message}
        </div>
      )}

      {/* ── Basic Information ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <PackagePlus className="size-5 text-primary-500" />
              {isEdit ? t("products.edit.title") : t("products.create.title")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label={t("products.fields.name")}
                required
                error={errors.name?.message || state.errors?.name?.[0]}
                {...register("name")}
              />
            </div>

            <Input
              label={t("products.fields.sku")}
              hint="Leave blank to auto-generate"
              error={errors.sku?.message || state.errors?.sku?.[0]}
              {...register("sku")}
            />

            <Input
              label={t("products.fields.barcode")}
              hint="Leave blank to auto-generate"
              error={errors.barcode?.message || state.errors?.barcode?.[0]}
              {...register("barcode")}
            />

            <div className="md:col-span-2">
              <div className="flex flex-col gap-1">
                <label className="label">
                  {t("products.fields.description")}
                </label>
                <textarea
                  rows={3}
                  className="input resize-y min-h-[80px]"
                  {...register("description")}
                />
                {errors.description?.message && (
                  <p className="text-xs text-danger-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Category & Classification ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-primary-500" />
              {t("products.fields.category")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className="label">
                {t("products.fields.category")}
                <span className="text-danger-500 ml-1">*</span>
              </label>
              <select
                className="input"
                {...register("category_id", { valueAsNumber: true })}
              >
                <option value={0}>— {t("products.fields.category")} —</option>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.prefix}
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id?.message && (
                <p className="text-xs text-danger-600">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="label">{t("products.fields.unit")}</label>
              <select className="input" {...register("unit_of_measure")}>
                <option value="piece">{t("common.piece")}</option>
                <option value="kg">{t("common.kg")}</option>
                <option value="g">g</option>
                <option value="litre">{t("common.litre")}</option>
                <option value="metre">metre</option>
                <option value="box">box</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="label">
                {t("products.fields.vat_rate")}
                <span className="text-danger-500 ml-1">*</span>
              </label>
              <select
                className="input"
                {...register("vat_rate_id", { valueAsNumber: true })}
              >
                {vatRates.map((vr) => (
                  <option key={vr.id} value={vr.id}>
                    {vr.name} ({vr.rate}%)
                    {vr.is_default ? " — default" : ""}
                  </option>
                ))}
              </select>
              {errors.vat_rate_id?.message && (
                <p className="text-xs text-danger-600">
                  {errors.vat_rate_id.message}
                </p>
              )}
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2.5 cursor-pointer h-9">
                <input
                  type="checkbox"
                  className="size-4 accent-primary-500 rounded"
                  {...register("has_variants")}
                />
                <span className="text-sm text-fg font-medium">
                  {t("products.actions.view_variants")}
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Pricing & Stock ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-lg">$</span>
              {t("common.price")} & {t("common.quantity")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input
              label={t("products.fields.buy_price")}
              type="number"
              step="0.01"
              min="0"
              required
              suffix="XAF"
              error={
                errors.price_buy_ht?.message || state.errors?.price_buy_ht?.[0]
              }
              {...register("price_buy_ht", { valueAsNumber: true })}
            />

            <Input
              label={t("products.fields.sell_price")}
              type="number"
              step="0.01"
              min="0"
              required
              suffix="XAF"
              error={
                errors.price_sell_ttc?.message ||
                state.errors?.price_sell_ttc?.[0]
              }
              {...register("price_sell_ttc", { valueAsNumber: true })}
            />

            <Input
              label={t("products.fields.threshold")}
              type="number"
              step="0.001"
              min="0"
              error={errors.stock_alert_threshold?.message}
              {...register("stock_alert_threshold", { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Dynamic Category Fields ───────────────────────── */}
      {productFields.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{selectedCategory?.name} — Custom Fields</CardTitle>
              <Badge variant="primary">{productFields.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DynamicFieldRenderer
              fields={productFields}
              namePrefix="attributes"
              register={register}
              control={control as never}
              errors={errors.attributes}
              useFrenchLabels={locale === "fr"}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Form Actions ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          icon={<ArrowLeft className="size-4" />}
          onClick={() => router.back()}
        >
          {t("common.back")}
        </Button>

        <Button
          type="submit"
          loading={isPending}
          icon={<Save className="size-4" />}
        >
          {isEdit ? t("common.update") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findCategory(cats: Category[], id: number): Category | undefined {
  for (const cat of cats) {
    if (cat.id === id) return cat;
    if (cat.children?.length) {
      const found = findCategory(cat.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function flattenCats(
  cats: Category[],
  depth = 0,
): { id: number; name: string; prefix: string }[] {
  const result: { id: number; name: string; prefix: string }[] = [];
  for (const cat of cats) {
    result.push({
      id: cat.id,
      name: cat.name,
      prefix: depth > 0 ? "\u00A0\u00A0".repeat(depth) + "└ " : "",
    });
    if (cat.children?.length) {
      result.push(...flattenCats(cat.children, depth + 1));
    }
  }
  return result;
}
