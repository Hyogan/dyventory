"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Filter, X } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";
  const currentCategory = searchParams.get("category_id") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentLowStock = searchParams.get("low_stock") === "1";

  const hasFilters = currentSearch || currentCategory || currentStatus || currentLowStock;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset page when filters change
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const clearAll = () => {
    router.push(pathname);
  };

  // Flatten categories for the select
  const flatCategories = flattenCategories(categories);

  return (
    <div className="space-y-3">
      {/* Search + action row */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={currentSearch}
          onChange={(val) => updateParams({ search: val || undefined })}
          placeholder={t("common.search")}
          className="w-full sm:w-72"
        />

        {/* Category select */}
        <div className="relative">
          <select
            value={currentCategory}
            onChange={(e) => updateParams({ category_id: e.target.value || undefined })}
            className="input pr-8 min-w-[160px] appearance-none"
          >
            <option value="">{t("products.fields.category")}</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.prefix}{cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status select */}
        <select
          value={currentStatus}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          className="input min-w-[130px] appearance-none"
        >
          <option value="">{t("common.status")}</option>
          <option value="active">{t("common.active")}</option>
          <option value="archived">{t("common.archived")}</option>
        </select>

        {/* Low stock toggle */}
        <button
          type="button"
          onClick={() => updateParams({ low_stock: currentLowStock ? undefined : "1" })}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors",
            currentLowStock
              ? "bg-warning-100 border-warning-300 text-warning-700"
              : "border-border text-fg-subtle hover:bg-surface-muted",
          )}
        >
          <Filter className="size-3.5" />
          {t("products.low_stock")}
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} icon={<X className="size-3.5" />}>
            {t("common.reset")}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface FlatCategory {
  id: number;
  name: string;
  prefix: string;
}

function flattenCategories(
  categories: Category[],
  depth = 0,
): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    result.push({
      id: cat.id,
      name: cat.name,
      prefix: depth > 0 ? "\u00A0\u00A0".repeat(depth) + "└ " : "",
    });
    if (cat.children?.length) {
      result.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}
