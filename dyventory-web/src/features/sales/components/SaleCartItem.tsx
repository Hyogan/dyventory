"use client";

import { Trash2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSaleStore, computeLineTotal, type CartItem } from "@/stores/useSaleStore";
import { cn } from "@/lib/utils";

interface SaleCartItemProps {
  item: CartItem;
}

export function SaleCartItem({ item }: SaleCartItemProps) {
  const t = useTranslations("sales");
  const updateQuantity = useSaleStore((s) => s.updateQuantity);
  const updateDiscount = useSaleStore((s) => s.updateDiscount);
  const removeItem = useSaleStore((s) => s.removeItem);

  const isKg =
    item.product.unit_of_measure === "kg" ||
    item.product.unit_of_measure === "g";

  const { line_total_ttc } = computeLineTotal(item);

  const adjustQty = (delta: number) => {
    const step = isKg ? 0.1 : 1;
    const newQty = Math.round((item.quantity + delta * step) * 1000) / 1000;
    updateQuantity(item.product.id, item.variant_id, Math.max(isKg ? 0.001 : 1, newQty));
  };

  return (
    <li className="flex gap-3 py-3.5 border-b border-border last:border-0 group">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg truncate">
              {item.product.name}
            </p>
            <p className="text-xs text-fg-muted font-mono">{item.product.sku}</p>
          </div>
          <button
            onClick={() => removeItem(item.product.id, item.variant_id)}
            className="shrink-0 p-1 rounded text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label={t("cart.remove")}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {/* Qty stepper */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustQty(-1)}
              className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-surface-muted transition-colors text-fg-muted"
            >
              <Minus className="size-3" />
            </button>
            <input
              type="number"
              value={item.quantity}
              min={isKg ? 0.001 : 1}
              step={isKg ? 0.1 : 1}
              onChange={(e) =>
                updateQuantity(
                  item.product.id,
                  item.variant_id,
                  parseFloat(e.target.value) || 0,
                )
              }
              className={cn(
                "w-16 text-center text-sm border border-border rounded-md h-7 bg-surface-card",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                "tabular-nums",
              )}
              aria-label="Quantity"
            />
            <button
              onClick={() => adjustQty(1)}
              className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-surface-muted transition-colors text-fg-muted"
            >
              <Plus className="size-3" />
            </button>
            <span className="text-xs text-fg-muted">
              {item.product.unit_of_measure}
            </span>
          </div>

          {/* Discount */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-fg-muted">Disc.</span>
            <input
              type="number"
              value={item.discount_percent}
              min={0}
              max={100}
              step={0.5}
              onChange={(e) =>
                updateDiscount(
                  item.product.id,
                  item.variant_id,
                  parseFloat(e.target.value) || 0,
                )
              }
              className={cn(
                "w-14 text-center text-sm border border-border rounded-md h-7 bg-surface-card",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                "tabular-nums",
              )}
              aria-label="Discount %"
            />
            <span className="text-xs text-fg-muted">%</span>
          </div>
        </div>
      </div>

      {/* Line total */}
      <div className="shrink-0 text-right pt-0.5 min-w-[80px]">
        <p className="text-sm font-semibold text-fg tabular-nums">
          {line_total_ttc.toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{" "}
          <span className="text-xs font-normal text-fg-muted">F</span>
        </p>
        <p className="text-xs text-fg-muted tabular-nums">
          ×{" "}
          {parseFloat(item.product.price_sell_ttc).toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </li>
  );
}
