"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useTransition } from "react";
import {
  Eye,
  CheckCircle2,
  XCircle,
  User,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { confirmSale, cancelSale } from "../actions";
import type { Sale, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

function fmt(n: string | number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n));
}

interface SalesTableProps {
  sales: Sale[];
  meta: PaginationMeta;
}

export function SalesTable({ sales, meta }: SalesTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [actionSaleId, setActionSaleId] = useState<number | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleConfirm = (sale: Sale) => {
    setActionSaleId(sale.id);
    startTransition(async () => {
      await confirmSale(sale.id);
      setActionSaleId(null);
      router.refresh();
    });
  };

  const handleCancel = (sale: Sale) => {
    if (!confirm(`Cancel sale ${sale.sale_number}?`)) return;
    setActionSaleId(sale.id);
    startTransition(async () => {
      await cancelSale(sale.id);
      setActionSaleId(null);
      router.refresh();
    });
  };

  const columns: Column<Sale>[] = [
    {
      key: "sale_number",
      header: t("sales.fields.sale_number"),
      render: (sale) => (
        <Link
          href={`/${locale}/sales/${sale.id}`}
          className="group flex items-center gap-2.5"
        >
          <div className="size-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            <ShoppingBag className="size-3.5 text-primary-600" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-fg group-hover:text-primary-600 transition-colors">
              {sale.sale_number}
            </p>
            <p className="text-xs text-fg-muted">
              {new Date(sale.created_at).toLocaleDateString(locale)}
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: "client",
      header: t("sales.fields.client"),
      render: (sale) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-surface-muted border border-border flex items-center justify-center shrink-0">
            <User className="size-3.5 text-fg-muted" />
          </div>
          <span className="text-sm text-fg truncate max-w-[140px]">
            {sale.client?.name ?? (
              <span className="text-fg-muted italic">Anonymous</span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "total_ttc",
      header: t("sales.fields.total"),
      align: "right",
      render: (sale) => (
        <div className="text-right">
          <p className="font-semibold text-fg tabular-nums">
            {fmt(sale.total_ttc)} <span className="text-xs font-normal text-fg-muted">F</span>
          </p>
          {parseFloat(sale.discount_amount) > 0 && (
            <p className="text-xs text-success-600 tabular-nums">
              −{fmt(sale.discount_amount)} F
            </p>
          )}
        </div>
      ),
    },
    {
      key: "payment_status",
      header: t("common.status"),
      align: "center",
      render: (sale) => (
        <div className="flex flex-col items-center gap-1">
          <StatusBadge status={sale.status} />
          <StatusBadge status={sale.payment_status} />
        </div>
      ),
    },
    {
      key: "amount_due",
      header: t("sales.fields.amount_due"),
      align: "right",
      render: (sale) => {
        const due = parseFloat(sale.amount_due);
        return (
          <span
            className={cn(
              "text-sm tabular-nums font-medium",
              due > 0 ? "text-warning-600" : "text-fg-muted",
            )}
          >
            {due > 0 ? `${fmt(due)} F` : "—"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "w-28",
      render: (sale) => {
        const isLoading = isPending && actionSaleId === sale.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/${locale}/sales/${sale.id}`}>
              <button
                className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="View"
              >
                <Eye className="size-3.5" />
              </button>
            </Link>
            {sale.status === "draft" && (
              <button
                onClick={() => handleConfirm(sale)}
                disabled={isLoading}
                className="p-1.5 rounded-md text-fg-muted hover:text-success-600 hover:bg-success-50 transition-colors disabled:opacity-50"
                title="Confirm"
              >
                <CheckCircle2 className="size-3.5" />
              </button>
            )}
            {(sale.status === "draft" || sale.status === "confirmed") && (
              <button
                onClick={() => handleCancel(sale)}
                disabled={isLoading}
                className="p-1.5 rounded-md text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
                title="Cancel"
              >
                <XCircle className="size-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={sales}
      columns={columns}
      meta={meta}
      onPageChange={handlePageChange}
      emptyTitle={t("sales.title")}
      emptyMessage={t("sales.empty")}
    />
  );
}
