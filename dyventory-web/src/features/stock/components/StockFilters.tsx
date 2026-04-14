"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface StockFiltersProps {
  categories: Category[];
}

function flattenCategories(
  cats: Category[],
  depth = 0,
): { id: number; name: string; depth: number }[] {
  return cats.flatMap((c) => [
    { id: c.id, name: c.name, depth },
    ...flattenCategories(c.children ?? [], depth + 1),
  ]);
}

export function StockFilters({ categories }: StockFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = {
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    category_id: searchParams.get("category_id") ?? "",
    expiry_warning: searchParams.get("expiry_warning") === "1",
  };

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const hasFilters =
    current.search || current.status || current.category_id || current.expiry_warning;

  const flat = flattenCategories(categories);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={current.search}
        onChange={(v) => setParam("search", v || null)}
        placeholder={t("common.search")}
        className="w-56"
      />

      {/* Category filter */}
      <select
        value={current.category_id}
        onChange={(e) => setParam("category_id", e.target.value || null)}
        className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">{t("common.all")} categories</option>
        {flat.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {"  ".repeat(c.depth) + c.name}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={current.status}
        onChange={(e) => setParam("status", e.target.value || null)}
        className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">{t("common.all")} statuses</option>
        <option value="active">Active</option>
        <option value="depleted">Depleted</option>
        <option value="expired">Expired</option>
      </select>

      {/* Expiry warning toggle */}
      <button
        type="button"
        onClick={() =>
          setParam("expiry_warning", current.expiry_warning ? null : "1")
        }
        className={cn(
          "h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
          current.expiry_warning
            ? "bg-danger-100 border-danger-300 text-danger-700"
            : "border-border bg-surface text-fg-subtle hover:bg-surface-muted",
        )}
      >
        {t("stock.alerts.expiry_soon")}
      </button>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
        >
          {t("common.reset")}
        </Button>
      )}
    </div>
  );
}
