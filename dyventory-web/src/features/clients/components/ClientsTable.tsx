"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { Eye, Edit2, Trash2, User2, Building2 } from "lucide-react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { Badge } from "@/components/ui/Badge";
import { deleteClient } from "../actions";
import type { Client, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const TYPE_VARIANTS: Record<string, "primary" | "secondary" | "warning" | "default"> = {
  individual: "default",
  company: "primary",
  reseller: "secondary",
  wholesaler: "warning",
  retailer: "secondary",
};

interface ClientsTableProps {
  clients: Client[];
  meta: PaginationMeta;
  onEdit: (client: Client) => void;
}

export function ClientsTable({ clients, meta, onEdit }: ClientsTableProps) {
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

  const handleDelete = (client: Client) => {
    if (!confirm(t("common.deleteConfirm"))) return;
    setActionId(client.id);
    startTransition(async () => {
      await deleteClient(client.id);
      setActionId(null);
      router.refresh();
    });
  };

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: t("clients.fields.name"),
      render: (client) => (
        <Link href={`/${locale}/clients/${client.id}`} className="group flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            {client.type === "individual" ? (
              <User2 className="size-3.5 text-primary-600" />
            ) : (
              <Building2 className="size-3.5 text-primary-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-fg group-hover:text-primary-600 transition-colors">
              {client.name}
            </p>
            {client.email && (
              <p className="text-xs text-fg-muted truncate max-w-[180px]">{client.email}</p>
            )}
          </div>
        </Link>
      ),
    },
    {
      key: "type",
      header: t("clients.fields.type"),
      render: (client) => (
        <Badge variant={TYPE_VARIANTS[client.type] ?? "default"}>
          {t(`clients.types.${client.type}`)}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: t("clients.fields.phone"),
      render: (client) => (
        <span className="text-sm text-fg-muted">{client.phone ?? "—"}</span>
      ),
    },
    {
      key: "credit_limit",
      header: t("clients.fields.credit_limit"),
      align: "right",
      render: (client) => (
        <div className="text-right">
          <p className="text-sm font-medium tabular-nums text-fg">
            {fmt(client.credit_limit)} <span className="text-xs font-normal text-fg-muted">F</span>
          </p>
          {client.outstanding_balance > 0 && (
            <p className="text-xs text-warning-600 tabular-nums">
              {fmt(client.outstanding_balance)} F due
            </p>
          )}
        </div>
      ),
    },
    {
      key: "is_active",
      header: t("common.status"),
      align: "center",
      render: (client) => (
        <Badge variant={client.is_active ? "success" : "default"}>
          {client.is_active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "w-24",
      render: (client) => {
        const isLoading = isPending && actionId === client.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/${locale}/clients/${client.id}`}>
              <button
                className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title={t("common.view")}
              >
                <Eye className="size-3.5" />
              </button>
            </Link>
            <button
              onClick={() => onEdit(client)}
              className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title={t("common.edit")}
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              onClick={() => handleDelete(client)}
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
      data={clients}
      columns={columns}
      meta={meta}
      onPageChange={handlePageChange}
      emptyTitle={t("clients.title")}
      emptyMessage={t("clients.empty")}
    />
  );
}
