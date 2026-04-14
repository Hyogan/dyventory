"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Package, Plus, ArrowUpRight, AlertTriangle } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExpiryBadge } from "./ExpiryBadge";
import { StockLevelBar } from "./StockLevelBar";
import type { Batch, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

interface StockTableProps {
  batches: Batch[];
  meta: PaginationMeta;
}

export function StockTable({ batches, meta }: StockTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const columns: Column<Batch>[] = [
    {
      key: "product",
      header: t("stock.fields.product"),
      render: (batch) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
            <Package className="size-4 text-fg-muted" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-fg truncate">
              {batch.product?.name ?? "—"}
            </p>
            <p className="text-xs text-fg-muted font-mono">
              {batch.batch_number ?? `#${batch.id}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "current_quantity",
      header: t("common.quantity"),
      align: "right",
      render: (batch) => {
        const current = Number(batch.current_quantity);
        const initial = Number(batch.initial_quantity);
        const unit = batch.product?.unit_of_measure;

        return (
          <StockLevelBar
            current={current}
            initial={initial}
            unit={unit}
            className="justify-end"
          />
        );
      },
    },
    {
      key: "expiry",
      header: "Expiry",
      align: "center",
      render: (batch) => {
        if (!batch.expiry_date) {
          return <span className="text-xs text-fg-muted">—</span>;
        }

        return (
          <ExpiryBadge
            daysUntilExpiry={batch.days_until_expiry ?? null}
            isExpired={batch.is_expired ?? false}
          />
        );
      },
    },
    {
      key: "status",
      header: t("common.status"),
      align: "center",
      render: (batch) => {
        const variantMap: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
          active: "success",
          depleted: "secondary",
          expired: "danger",
        };
        return (
          <Badge variant={variantMap[batch.status] ?? "default"}>
            {batch.status}
          </Badge>
        );
      },
    },
    {
      key: "received_at",
      header: t("stock.fields.date"),
      render: (batch) => (
        <span className="text-sm text-fg-subtle tabular-nums">
          {batch.received_at
            ? new Date(batch.received_at).toLocaleDateString(locale)
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "w-24",
      render: (batch) => (
        <div className="flex items-center justify-end gap-1.5">
          <a
            href={`/${locale}/stock/entry?batch_id=${batch.id}`}
            title="Add stock"
            className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <Plus className="size-3.5" />
          </a>
          <a
            href={`/${locale}/stock/exit?batch_id=${batch.id}`}
            title="Remove stock"
            className="p-1.5 rounded-md text-fg-muted hover:text-warning-600 hover:bg-warning-50 transition-colors"
          >
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={batches}
      columns={columns}
      meta={meta}
      onPageChange={handlePageChange}
      emptyTitle={t("stock.title")}
      emptyMessage={t("stock.empty")}
    />
  );
}

// ── Alert summary bar ─────────────────────────────────────────────────────────

interface StockAlertBarProps {
  lowStockCount: number;
  expiringCount: number;
}

export function StockAlertBar({ lowStockCount, expiringCount }: StockAlertBarProps) {
  const t = useTranslations("stock");

  if (lowStockCount === 0 && expiringCount === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {lowStockCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-50 border border-warning-200 text-warning-700 text-sm">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>
            {lowStockCount} {t("alerts.low_stock")}
          </span>
        </div>
      )}
      {expiringCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>
            {expiringCount} {t("alerts.expiry_soon")}
          </span>
        </div>
      )}
    </div>
  );
}
