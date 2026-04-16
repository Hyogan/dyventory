"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { SearchInput } from "@/components/shared/SearchInput";

const SALE_STATUSES = ["draft", "confirmed", "delivered", "cancelled", "returned"] as const;
const PAYMENT_STATUSES = ["pending", "partial", "paid", "overdue", "refunded"] as const;

export function SaleFilters() {
  const t = useTranslations("sales");
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
    status: searchParams.get("status") ?? "",
    payment_status: searchParams.get("payment_status") ?? "",
    date_from: searchParams.get("date_from") ?? "",
    date_to: searchParams.get("date_to") ?? "",
  };

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className="card p-4 space-y-3">
      {/* Search */}
      <SearchInput
        value={current.search}
        onChange={(v) => push("search", v)}
        placeholder={t("cart.search_products")}
      />

      <div className="flex flex-wrap gap-3">
        {/* Status */}
        <select
          value={current.status}
          onChange={(e) => push("status", e.target.value)}
          className="input-select h-9 text-sm flex-1 min-w-[150px]"
          aria-label="Sale status"
        >
          <option value="">{t("filters.all_statuses")}</option>
          {SALE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>

        {/* Payment status */}
        <select
          value={current.payment_status}
          onChange={(e) => push("payment_status", e.target.value)}
          className="input-select h-9 text-sm flex-1 min-w-[150px]"
          aria-label="Payment status"
        >
          <option value="">{t("filters.all_payment_statuses")}</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`payment_status.${s === "pending" ? "pending" : s}`)}
            </option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={current.date_from}
          onChange={(e) => push("date_from", e.target.value)}
          className="input h-9 text-sm w-[145px]"
          aria-label={t("filters.date_from")}
          title={t("filters.date_from")}
        />
        <input
          type="date"
          value={current.date_to}
          onChange={(e) => push("date_to", e.target.value)}
          className="input h-9 text-sm w-[145px]"
          aria-label={t("filters.date_to")}
          title={t("filters.date_to")}
        />

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-sm text-fg-muted hover:text-fg transition-colors px-2"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
