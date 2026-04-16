"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { SearchInput } from "@/components/shared/SearchInput";

export function SupplierFilters() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
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

  const current = {
    search: searchParams.get("search") ?? "",
    is_active: searchParams.get("is_active") ?? "",
  };

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className="card p-4 space-y-3">
      <SearchInput
        value={current.search}
        onChange={(v) => push("search", v)}
        placeholder={t("common.search")}
      />
      <div className="flex flex-wrap gap-3">
        <select
          value={current.is_active}
          onChange={(e) => push("is_active", e.target.value)}
          className="input-select h-9 text-sm flex-1 min-w-[150px]"
          aria-label={t("common.status")}
        >
          <option value="">{t("common.all")}</option>
          <option value="1">{t("common.active")}</option>
          <option value="0">{t("common.inactive")}</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-sm text-fg-muted hover:text-fg transition-colors px-2"
          >
            {t("common.reset")}
          </button>
        )}
      </div>
    </div>
  );
}
