"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, Package, Plus, Loader2 } from "lucide-react";
import { clientAuthFetch } from "@/lib/client-auth";
import { useSaleStore } from "@/stores/useSaleStore";
import { cn } from "@/lib/utils";
import type { Product, PaginatedResponse } from "@/types";

export function ProductSearch() {
  const t = useTranslations("sales");
  const addItem = useSaleStore((s) => s.addItem);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await clientAuthFetch<PaginatedResponse<Product>>(
        `/products?search=${encodeURIComponent(q)}&status=active&per_page=8`,
      );
      setResults(res.data);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  const handleSelect = (product: Product) => {
    addItem(product);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const isKg = (product: Product) =>
    product.unit_of_measure === "kg" || product.unit_of_measure === "g";

  const stock = (product: Product) =>
    product.current_stock != null ? product.current_stock : null;

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted animate-spin pointer-events-none" />
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={t("cart.search_products")}
          className="input pl-10 pr-10 h-11 text-sm w-full"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="product-results"
        />
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          id="product-results"
          ref={listRef}
          role="listbox"
          className="absolute z-30 top-full mt-1.5 w-full bg-surface-card border border-border rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto scrollbar-thin"
        >
          {results.map((product, idx) => {
            const s = stock(product);
            const outOfStock = s !== null && s <= 0;

            return (
              <li
                key={product.id}
                role="option"
                aria-selected={idx === activeIndex}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                  idx === activeIndex
                    ? "bg-primary-50"
                    : "hover:bg-surface-hover",
                  outOfStock && "opacity-60",
                )}
                onMouseDown={() => !outOfStock && handleSelect(product)}
              >
                {/* Icon */}
                <div className="size-9 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                  <Package className="size-4 text-fg-muted" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-fg-muted">
                    <span className="font-mono">{product.sku}</span>
                    {s !== null && (
                      <span
                        className={cn(
                          "ml-2",
                          outOfStock
                            ? "text-danger-600"
                            : "text-success-600",
                        )}
                      >
                        · {s} {isKg(product) ? "kg" : "pcs"}
                      </span>
                    )}
                  </p>
                </div>

                {/* Price */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-fg tabular-nums">
                    {parseFloat(product.price_sell_ttc).toLocaleString("fr-FR")} F
                  </p>
                  <p className="text-xs text-fg-muted">{product.unit_of_measure}</p>
                </div>

                {/* Add icon */}
                <div
                  className={cn(
                    "shrink-0 size-7 rounded-lg flex items-center justify-center",
                    outOfStock
                      ? "bg-surface-muted text-fg-muted"
                      : "bg-primary-500 text-white",
                  )}
                >
                  <Plus className="size-3.5" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isOpen && !loading && results.length === 0 && query.trim() && (
        <div className="absolute z-30 top-full mt-1.5 w-full bg-surface-card border border-border rounded-xl shadow-lg px-4 py-6 text-center text-sm text-fg-muted">
          No products found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
