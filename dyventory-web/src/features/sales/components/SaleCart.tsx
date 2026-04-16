"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { useSaleStore } from "@/stores/useSaleStore";
import { ProductSearch } from "./ProductSearch";
import { SaleCartItem } from "./SaleCartItem";

export function SaleCart() {
  const t = useTranslations("sales");
  const items = useSaleStore((s) => s.items);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="mb-4">
        <ProductSearch />
      </div>

      {/* Cart header */}
      {items.length > 0 && (
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="text-xs font-medium text-fg-muted uppercase tracking-wide">
            {t("cart.title")} · {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Cart items */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <div className="size-14 rounded-2xl bg-surface-muted border border-border flex items-center justify-center mb-4">
            <ShoppingCart className="size-6 text-fg-muted" />
          </div>
          <p className="text-sm font-medium text-fg-subtle">Cart is empty</p>
          <p className="text-xs text-fg-muted mt-1 max-w-[220px]">
            {t("cart.empty")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-y-auto flex-1 scrollbar-thin -mx-0.5 px-0.5">
          {items.map((item) => (
            <SaleCartItem
              key={`${item.product.id}-${item.variant_id}`}
              item={item}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
