"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function PromotionFilters() {
  const t  = useTranslations("promotions");
  const tc = useTranslations("common");

  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();
  const [, start] = useTransition();

  const push = (key: string, value: string) => {
    start(() => {
      const params = new URLSearchParams(sp.toString());
      value ? params.set(key, value) : params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
        <input
          type="search"
          defaultValue={sp.get("search") ?? ""}
          onChange={(e) => push("search", e.target.value)}
          placeholder={tc("search")}
          className="input pl-9 h-9 w-56 text-sm"
        />
      </div>

      {/* Type filter */}
      <select
        defaultValue={sp.get("type") ?? ""}
        onChange={(e) => push("type", e.target.value)}
        className="input h-9 text-sm pr-8"
      >
        <option value="">{t("filters.all_types")}</option>
        <option value="percentage">{t("types.percentage")}</option>
        <option value="fixed_value">{t("types.fixed_value")}</option>
        <option value="bundle">{t("types.bundle")}</option>
      </select>

      {/* Active filter */}
      <select
        defaultValue={sp.get("is_active") ?? ""}
        onChange={(e) => push("is_active", e.target.value)}
        className="input h-9 text-sm pr-8"
      >
        <option value="">{t("filters.all_status")}</option>
        <option value="1">{t("filters.active_only")}</option>
        <option value="0">{tc("inactive")}</option>
      </select>
    </div>
  );
}
