"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { Eye, Edit2, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { Badge } from "@/components/ui/Badge";
import { deleteSupplier } from "../actions";
import type { Supplier, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface SuppliersTableProps {
  suppliers: Supplier[];
  meta: PaginationMeta;
  onEdit: (supplier: Supplier) => void;
}

export function SuppliersTable({ suppliers, meta, onEdit }: SuppliersTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<number | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = (supplier: Supplier) => {
    if (!confirm(t("common.deleteConfirm"))) return;
    setActionId(supplier.id);
    startTransition(async () => {
      await deleteSupplier(supplier.id);
      setActionId(null);
      router.refresh();
    });
  };

  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: t("suppliers.fields.name"),
      render: (supplier) => (
        <Link href={`/${locale}/suppliers/${supplier.id}`} className="group flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            <Truck className="size-3.5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-fg group-hover:text-primary-600 transition-colors">
              {supplier.name}
            </p>
            {supplier.contact_person && (
              <p className="text-xs text-fg-muted">{supplier.contact_person}</p>
            )}
          </div>
        </Link>
      ),
    },
    {
      key: "phone",
      header: t("suppliers.fields.phone"),
      render: (supplier) => (
        <div className="text-sm text-fg-muted">
          <p>{supplier.phone ?? "—"}</p>
          {supplier.email && <p className="text-xs">{supplier.email}</p>}
        </div>
      ),
    },
    {
      key: "lead_time_days",
      header: t("suppliers.fields.lead_time"),
      align: "center",
      render: (supplier) => (
        <span className="text-sm text-fg tabular-nums">{supplier.lead_time_days}d</span>
      ),
    },
    {
      key: "minimum_order_amount",
      header: t("suppliers.fields.min_order"),
      align: "right",
      render: (supplier) => (
        <span className="text-sm tabular-nums text-fg">
          {supplier.minimum_order_amount > 0 ? `${fmt(supplier.minimum_order_amount)} F` : "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: t("common.status"),
      align: "center",
      render: (supplier) => (
        <Badge variant={supplier.is_active ? "success" : "default"}>
          {supplier.is_active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "w-24",
      render: (supplier) => {
        const isLoading = isPending && actionId === supplier.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/${locale}/suppliers/${supplier.id}`}>
              <button
                className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title={t("common.view")}
              >
                <Eye className="size-3.5" />
              </button>
            </Link>
            <button
              onClick={() => onEdit(supplier)}
              className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title={t("common.edit")}
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              onClick={() => handleDelete(supplier)}
              disabled={isLoading}
              className={cn(
                "p-1.5 rounded-md text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50",
              )}
              title={t("common.delete")}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={suppliers}
      columns={columns}
      meta={meta}
      onPageChange={handlePageChange}
      emptyTitle={t("suppliers.title")}
      emptyMessage={t("suppliers.empty")}
    />
  );
}
