"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, X, Check, Package2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { clientAuthFetch } from "@/lib/client-auth";
import type { ProductVariant } from "@/types";
// import { clientAuthFetch } from "@/lib/auth";

interface VariantManagerProps {
  productId: number;
  productSku: string;
  variants: ProductVariant[];
}

interface VariantFormData {
  sku_variant: string;
  barcode_variant: string;
  attributes_variant: Record<string, string>;
  stock_alert_threshold: number;
  price_override_ttc: string;
  is_active: boolean;
}

const emptyForm: VariantFormData = {
  sku_variant: "",
  barcode_variant: "",
  attributes_variant: {},
  stock_alert_threshold: 0,
  price_override_ttc: "",
  is_active: true,
};

export function VariantManager({
  productId,
  productSku,
  variants: initialVariants,
}: VariantManagerProps) {
  const t = useTranslations();
  const [variants, setVariants] = useState(initialVariants);
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null,
  );
  const [form, setForm] = useState<VariantFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);
  const [isPending, startTransition] = useTransition();

  // Attribute editing
  const [attrKey, setAttrKey] = useState("");
  const [attrValue, setAttrValue] = useState("");

  const openCreate = () => {
    setEditingVariant(null);
    setForm({ ...emptyForm, sku_variant: `${productSku}-` });
    setShowModal(true);
  };

  const openEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setForm({
      sku_variant: variant.sku_variant,
      barcode_variant: variant.barcode_variant ?? "",
      attributes_variant: (variant.attributes_variant ?? {}) as Record<
        string,
        string
      >,
      stock_alert_threshold: Number(variant.stock_alert_threshold),
      price_override_ttc: variant.price_override_ttc ?? "",
      is_active: variant.is_active,
    });
    setShowModal(true);
  };

  const addAttribute = () => {
    if (!attrKey.trim()) return;
    setForm((prev) => ({
      ...prev,
      attributes_variant: {
        ...prev.attributes_variant,
        [attrKey.trim()]: attrValue,
      },
    }));
    setAttrKey("");
    setAttrValue("");
  };

  const removeAttribute = (key: string) => {
    setForm((prev) => {
      const { [key]: _, ...rest } = prev.attributes_variant;
      return { ...prev, attributes_variant: rest };
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          stock_alert_threshold: form.stock_alert_threshold,
          price_override_ttc: form.price_override_ttc || null,
          attributes_variant: form.attributes_variant,
        };

        if (editingVariant) {
          const res = await clientAuthFetch<{ data: ProductVariant }>(
            `/variants/${editingVariant.id}`,
            { method: "PUT", body: JSON.stringify(payload) },
          );
          setVariants((prev) =>
            prev.map((v) => (v.id === editingVariant.id ? res.data : v)),
          );
        } else {
          const res = await clientAuthFetch<{ data: ProductVariant }>(
            `/products/${productId}/variants`,
            { method: "POST", body: JSON.stringify(payload) },
          );
          setVariants((prev) => [...prev, res.data]);
        }

        setShowModal(false);
      } catch (err) {
        console.error("Variant save failed:", err);
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await clientAuthFetch(`/variants/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setVariants((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    } catch (err) {
      console.error("Variant delete failed:", err);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package2 className="size-5 text-primary-500" />
          <h3 className="font-semibold text-fg">Variants</h3>
          <Badge variant="primary">{variants.length}</Badge>
        </div>
        <Button
          size="sm"
          icon={<Plus className="size-4" />}
          onClick={openCreate}
        >
          Add variant
        </Button>
      </div>

      {/* Variant list */}
      {variants.length === 0 ? (
        <div className="text-center py-8 text-fg-muted text-sm">
          No variants yet. Add dimensions like size, colour, etc.
        </div>
      ) : (
        <div className="space-y-2">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:border-primary-200 transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <Package2 className="size-5 text-primary-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-fg font-mono text-sm truncate">
                    {variant.sku_variant}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {Object.entries(variant.attributes_variant ?? {}).map(
                      ([k, v]) => (
                        <Badge key={k} variant="default">
                          {k}: {String(v)}
                        </Badge>
                      ),
                    )}
                    {!variant.is_active && (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                    {variant.price_override_ttc && (
                      <Badge variant="success">
                        {Number(variant.price_override_ttc).toLocaleString()}{" "}
                        XAF
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(variant)}
                  className="p-2 rounded-md hover:bg-surface-muted text-fg-muted hover:text-fg transition-colors"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(variant)}
                  className="p-2 rounded-md hover:bg-danger-50 text-fg-muted hover:text-danger-600 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingVariant ? "Edit Variant" : "New Variant"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              loading={isPending}
              icon={<Check className="size-4" />}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Variant SKU"
              required
              value={form.sku_variant}
              onChange={(e) =>
                setForm((p) => ({ ...p, sku_variant: e.target.value }))
              }
            />
            <Input
              label="Barcode"
              value={form.barcode_variant}
              onChange={(e) =>
                setForm((p) => ({ ...p, barcode_variant: e.target.value }))
              }
            />
            <Input
              label="Price override (TTC)"
              type="number"
              step="0.01"
              min="0"
              suffix="XAF"
              hint="Leave empty to use product price"
              value={form.price_override_ttc}
              onChange={(e) =>
                setForm((p) => ({ ...p, price_override_ttc: e.target.value }))
              }
            />
            <Input
              label="Stock alert threshold"
              type="number"
              step="0.001"
              min="0"
              value={form.stock_alert_threshold}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  stock_alert_threshold: Number(e.target.value),
                }))
              }
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="size-4 accent-primary-500 rounded"
              checked={form.is_active}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_active: e.target.checked }))
              }
            />
            <span className="text-sm text-fg font-medium">
              {t("common.active")}
            </span>
          </label>

          {/* Attributes (key-value pairs) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-fg">Attributes</h4>

            {Object.entries(form.attributes_variant).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge variant="primary">{key}</Badge>
                <span className="text-sm text-fg">{val}</span>
                <button
                  type="button"
                  onClick={() => removeAttribute(key)}
                  className="p-1 text-fg-muted hover:text-danger-500 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-end gap-2">
              <Input
                label="Key"
                placeholder="e.g. size"
                value={attrKey}
                onChange={(e) => setAttrKey(e.target.value)}
              />
              <Input
                label="Value"
                placeholder="e.g. M"
                value={attrValue}
                onChange={(e) => setAttrValue(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={addAttribute}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("common.delete")}
        description={`Delete variant "${deleteTarget?.sku_variant}"? This action cannot be undone.`}
        variant="danger"
      />
    </div>
  );
}
