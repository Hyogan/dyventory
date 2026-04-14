"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/Button";
import type { StockMovement, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

interface MovementHistoryTableProps {
  movements: StockMovement[];
  meta: PaginationMeta;
}

const MOVEMENT_TYPES = [
  "in_purchase",
  "in_return",
  "out_sale",
  "out_loss",
  "out_expiry",
  "out_mortality",
  "adjustment",
] as const;

function MovementTypeIcon({ type }: { type: string }) {
  if (type.startsWith("in_"))
    return <ArrowDownCircle className="size-3.5 text-success-600" />;
  if (type.startsWith("out_"))
    return <ArrowUpCircle className="size-3.5 text-danger-500" />;
  return <RefreshCw className="size-3.5 text-fg-muted" />;
}

export function MovementHistoryTable({ movements, meta }: MovementHistoryTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentType = searchParams.get("type") ?? "";
  const currentDateFrom = searchParams.get("date_from") ?? "";
  const currentDateTo = searchParams.get("date_to") ?? "";

  const columns: Column<StockMovement>[] = [
    {
      key: "type",
      header: t("stock.fields.movement_type"),
      render: (m) => (
        <div className="flex items-center gap-2">
          <MovementTypeIcon type={m.type} />
          <span className="text-sm text-fg capitalize">
            {t(`stock.movement_types.${m.type as typeof MOVEMENT_TYPES[number]}`)}
          </span>
        </div>
      ),
    },
    {
      key: "product",
      header: t("stock.fields.product"),
      render: (m) => (
        <div className="min-w-0">
          <p className="text-sm text-fg truncate">{m.product?.name ?? "—"}</p>
          <p className="text-xs text-fg-muted font-mono">{m.batch?.batch_number}</p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: t("common.quantity"),
      align: "right",
      render: (m) => {
        const qty = Number(m.quantity);
        const isPositive = qty >= 0;
        return (
          <span
            className={cn(
              "font-medium tabular-nums text-sm",
              isPositive ? "text-success-600" : "text-danger-600",
            )}
          >
            {isPositive ? "+" : ""}
            {qty.toFixed(3)}
          </span>
        );
      },
    },
    {
      key: "user",
      header: "User",
      render: (m) => (
        <span className="text-sm text-fg-subtle">{m.user?.name ?? "—"}</span>
      ),
    },
    {
      key: "notes",
      header: t("common.notes"),
      render: (m) => (
        <span className="text-sm text-fg-muted truncate max-w-[200px] block">
          {m.notes ?? "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: t("common.date"),
      render: (m) => (
        <span className="text-sm text-fg-subtle tabular-nums whitespace-nowrap">
          {m.created_at
            ? new Date(m.created_at).toLocaleString(locale, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={currentType}
          onChange={(e) => setParam("type", e.target.value || null)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{t("common.all")} types</option>
          {MOVEMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`stock.movement_types.${type}`)}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={currentDateFrom}
          onChange={(e) => setParam("date_from", e.target.value || null)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="From"
        />
        <input
          type="date"
          value={currentDateTo}
          onChange={(e) => setParam("date_to", e.target.value || null)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="To"
        />

        {(currentType || currentDateFrom || currentDateTo) && (
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
            {t("common.reset")}
          </Button>
        )}
      </div>

      <DataTable
        data={movements}
        columns={columns}
        meta={meta}
        onPageChange={handlePageChange}
        emptyTitle={t("stock.history.title")}
        emptyMessage={t("stock.empty")}
      />
    </div>
  );
}
