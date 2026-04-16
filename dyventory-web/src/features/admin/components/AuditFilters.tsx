"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { SearchInput } from "@/components/shared/SearchInput";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function AuditFilters() {
  const t = useTranslations("admin.audit");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const current = {
    search: searchParams.get("search") ?? "",
    entity_type: searchParams.get("entity_type") ?? "",
    http_method: searchParams.get("http_method") ?? "",
    date_from: searchParams.get("date_from") ?? "",
    date_to: searchParams.get("date_to") ?? "",
  };

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className="card p-4 space-y-3">
      <SearchInput
        value={current.search}
        onChange={(v) => push("search", v)}
        placeholder="Search by user, action, entity…"
      />
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={current.entity_type}
          onChange={(e) => push("entity_type", e.target.value)}
          className="input h-9 text-sm flex-1 min-w-[150px]"
          placeholder="Entity type (e.g. Sale)"
        />
        <select
          value={current.http_method}
          onChange={(e) => push("http_method", e.target.value)}
          className="input-select h-9 text-sm w-[140px]"
          aria-label="HTTP Method"
        >
          <option value="">All methods</option>
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="date"
          value={current.date_from}
          onChange={(e) => push("date_from", e.target.value)}
          className="input h-9 text-sm w-[145px]"
          aria-label="From"
        />
        <input
          type="date"
          value={current.date_to}
          onChange={(e) => push("date_to", e.target.value)}
          className="input h-9 text-sm w-[145px]"
          aria-label="To"
        />
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-sm text-fg-muted hover:text-fg transition-colors px-2"
          >
            {tc("reset")}
          </button>
        )}
      </div>
    </div>
  );
}
