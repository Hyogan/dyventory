"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, Package, Plus, Loader2 } from "lucide-react";
import { clientAuthFetch } from "@/lib/client-auth";
import { useSaleStore } from "@/stores/useSaleStore";
import { cn } from "@/lib/utils";
import type { Product, Category, PaginatedResponse } from "@/types";

export function ProductSearch() {
  const t = useTranslations("sales");
  const addItem = useSaleStore((s) => s.addItem);

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch categories once on mount
  useEffect(() => {
    clientAuthFetch<{ data: Category[] }>("/categories?per_page=100")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string, catId: number | "") => {
    if (!q.trim() && catId === "") {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "active", per_page: "8" });
      if (q.trim()) params.set("search", q.trim());
      if (catId !== "") params.set("category_id", String(catId));
      const res = await clientAuthFetch<PaginatedResponse<Product>>(
        `/products?${params.toString()}`,
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
    debounceRef.current = setTimeout(() => search(query, categoryId), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, categoryId, search]);

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
    <div className="relative flex flex-col gap-2">
      {/* Search input + category filter row */}
      <div className="flex gap-2">
        {/* Input */}
        <div className="relative group flex-1">
          <Search
            className="
        absolute left-4 top-1/2 z-10 -translate-y-1/2
        size-4
        text-fg-muted
        transition-colors duration-200
        pointer-events-none
        group-focus-within:text-primary
      "
          />

          {loading && (
            <Loader2
              className="
          absolute right-4 top-1/2 z-10 -translate-y-1/2
          size-4
          text-primary
          animate-spin
          pointer-events-none
        "
            />
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
            className="
        w-full
        h-12
        rounded-2xl
        border border-border
        bg-surface-card
        backdrop-blur-md
        pl-12
        pr-12
        text-sm
        text-fg
        placeholder:text-fg-muted
        shadow-sm
        transition-all duration-200
        outline-none

        hover:border-border-strong
        hover:shadow-card

        focus:border-primary
        focus:ring-4
        focus:ring-primary/15
        focus:shadow-card-hover
      "
            aria-label="Search products"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="product-results"
          />
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className={cn(
              "h-12 rounded-2xl border border-border bg-surface-card px-3 text-sm text-fg shadow-sm transition-all duration-200 outline-none",
              "hover:border-border-strong focus:border-primary focus:ring-4 focus:ring-primary/15",
              categoryId !== "" && "border-primary text-primary font-medium",
            )}
          >
            <option value="">{t("cart.all_categories")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
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
                {/* Thumbnail */}
                <div className="size-14 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {product.images?.length ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/storage/${product.images[0]}`}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="size-4 text-fg-muted" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-fg-muted truncate">
                    <span className="font-mono">{product.sku}</span>
                    {product.category?.name && (
                      <span className="ml-2">· {product.category.name}</span>
                    )}
                    {s !== null && (
                      <span
                        className={cn(
                          "ml-2",
                          outOfStock ? "text-danger-600" : "text-success-600",
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
                    {parseFloat(product.price_sell_ttc).toLocaleString("fr-FR")}{" "}
                    F
                  </p>
                  <p className="text-xs text-fg-muted">
                    {product.unit_of_measure}
                  </p>
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

      {isOpen && !loading && results.length === 0 && (query.trim() || categoryId !== "") && (
        <div className="absolute z-30 top-full mt-1.5 w-full bg-surface-card border border-border rounded-xl shadow-lg px-4 py-6 text-center text-sm text-fg-muted">
          No products found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
