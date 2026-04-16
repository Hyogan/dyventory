"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createOrder } from "../actions";
import type { Supplier, Product } from "@/types";

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier;
  products: Product[];
}

interface OrderLine {
  product_id: string;
  quantity_ordered: string;
  unit_price_ht: string;
}

const EMPTY_LINE: OrderLine = { product_id: "", quantity_ordered: "1", unit_price_ht: "0" };

export function NewOrderModal({ open, onClose, supplier, products }: NewOrderModalProps) {
  const t = useTranslations("suppliers");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ ...EMPTY_LINE }]);

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof OrderLine, value: string) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
    // Auto-fill buy price when product selected
    if (field === "product_id" && value) {
      const product = products.find((p) => String(p.id) === value);
      if (product) {
        setLines((prev) =>
          prev.map((line, i) =>
            i === index ? { ...line, unit_price_ht: product.price_buy_ht } : line,
          ),
        );
      }
    }
  };

  const total = lines.reduce(
    (sum, l) => sum + (parseFloat(l.quantity_ordered) || 0) * (parseFloat(l.unit_price_ht) || 0),
    0,
  );

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        expected_at: expectedAt || undefined,
        notes: notes || undefined,
        items: lines
          .filter((l) => l.product_id)
          .map((l) => ({
            product_id: parseInt(l.product_id),
            quantity_ordered: parseFloat(l.quantity_ordered) || 1,
            unit_price_ht: parseFloat(l.unit_price_ht) || 0,
          })),
      };

      const result = await createOrder(supplier.id, payload);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setErrors(result.errors ?? {});
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("order_form.title")}
      description={supplier.name}
      size="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {t("order_form.submit")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t("orders.expected")}</label>
            <input
              type="date"
              value={expectedAt}
              onChange={(e) => setExpectedAt(e.target.value)}
              className="input mt-1 text-sm"
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input mt-1 text-sm"
            />
          </div>
        </div>

        {/* Lines */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-fg">{t("orders.items")}</p>
            <Button variant="ghost" size="sm" icon={<Plus className="size-3.5" />} onClick={addLine}>
              {t("order_form.add_item")}
            </Button>
          </div>

          <div className="space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLine(index, "product_id", e.target.value)}
                    className="input-select h-9 text-sm w-full"
                  >
                    <option value="">{t("order_form.select_product")}</option>
                    {products.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={line.quantity_ordered}
                    onChange={(e) => updateLine(index, "quantity_ordered", e.target.value)}
                    className="input h-9 text-sm"
                    placeholder="Qty"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={line.unit_price_ht}
                    onChange={(e) => updateLine(index, "unit_price_ht", e.target.value)}
                    className="input h-9 text-sm"
                    placeholder="Price HT"
                  />
                </div>
                <div className="w-20 text-sm text-right pt-2 tabular-nums text-fg-muted">
                  {((parseFloat(line.quantity_ordered) || 0) * (parseFloat(line.unit_price_ht) || 0)).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} F
                </div>
                <button
                  onClick={() => removeLine(index)}
                  className="p-2 text-fg-muted hover:text-danger-600 transition-colors disabled:opacity-30"
                  disabled={lines.length === 1}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {errors.items && <p className="text-xs text-danger-600 mt-1">{errors.items[0]}</p>}

          <div className="mt-3 pt-3 border-t border-border flex justify-end">
            <p className="text-sm font-semibold text-fg">
              {t("orders.total")}:{" "}
              <span className="tabular-nums">
                {total.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} F
              </span>
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
