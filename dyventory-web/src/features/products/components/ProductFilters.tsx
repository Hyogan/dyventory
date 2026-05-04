"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Filter,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useProductsLoading } from "./ProductsLoadingContext";
import type { Category } from "@/types";

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startTransition } = useProductsLoading();

  const currentSearch = searchParams.get("search") ?? "";
  const currentCategory = searchParams.get("category_id") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentLowStock = searchParams.get("low_stock") === "1";

  const hasFilters = !!(
    currentSearch ||
    currentCategory ||
    currentStatus ||
    currentLowStock
  );

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams, startTransition],
  );

  const clearAll = () =>
    startTransition(() => router.push(pathname, { scroll: false }));
  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search Header - Floating Slab */}
      <div className="flex items-center gap-3">
        {/* <div className="relative flex-1 group"> */}
        {/* <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Search className="size-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          </div> */}
        <SearchInput
          value={currentSearch}
          onChange={(val) => updateParams({ search: val || undefined })}
          placeholder={t("common.search")}
          // TACTILE: Inner shadow and soft border to match the table image style
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] focus:border-slate-400 focus:shadow-md transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
        />
        {/* </div> */}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 h-12 px-5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 font-bold text-sm hover:bg-rose-100 active:scale-95 transition-all shadow-sm"
          >
            <X className="size-4" />
            {t("common.reset")}
          </button>
        )}
      </div>

      {/* Filter Dock - Layered Aesthetic */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/50 rounded-[22px] border border-slate-200/60 w-fit">
        {/* Icon Pillar */}
        <div className="flex items-center justify-center size-9 bg-white rounded-[16px] border border-slate-200 shadow-sm text-slate-500">
          <SlidersHorizontal className="size-4" />
        </div>

        <div className="flex items-center gap-1.5 px-1">
          {/* Category Dropdown */}
          <div className="relative group/select">
            <select
              value={currentCategory}
              onChange={(e) =>
                updateParams({ category_id: e.target.value || undefined })
              }
              className={cn(
                "appearance-none h-9 pl-3 pr-8 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border",
                currentCategory
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm",
              )}
            >
              <option value="">{t("products.fields.category")}</option>
              {flatCategories.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                  className="text-slate-900 bg-white"
                >
                  {cat.prefix}
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 size-3 pointer-events-none opacity-60",
                currentCategory && "text-white opacity-100",
              )}
            />
          </div>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          {/* Status Dropdown */}
          <div className="relative group/select">
            <select
              value={currentStatus}
              onChange={(e) =>
                updateParams({ status: e.target.value || undefined })
              }
              className={cn(
                "appearance-none h-9 pl-3 pr-8 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border",
                currentStatus
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm",
              )}
            >
              <option value="">{t("common.status")}</option>
              <option value="active">{t("common.active")}</option>
              <option value="archived">{t("common.archived")}</option>
            </select>
            <ChevronDown
              className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 size-3 pointer-events-none opacity-60",
                currentStatus && "text-white opacity-100",
              )}
            />
          </div>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          {/* Low Stock Toggle */}
          <button
            type="button"
            onClick={() =>
              updateParams({ low_stock: currentLowStock ? undefined : "1" })
            }
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition-all border shadow-sm",
              currentLowStock
                ? "bg-amber-500 border-amber-600 text-white shadow-amber-200 shadow-lg"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
            )}
          >
            <Filter
              className={cn("size-3", currentLowStock && "fill-current")}
            />
            {t("products.low_stock")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers (Logic Unchanged) ────────────────────────────────────────────────

interface FlatCategory {
  id: number;
  name: string;
  prefix: string;
}

function flattenCategories(categories: Category[], depth = 0): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    result.push({
      id: cat.id,
      name: cat.name,
      prefix: depth > 0 ? "· ".repeat(depth) : "",
    });
    if (cat.children?.length) {
      result.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}
