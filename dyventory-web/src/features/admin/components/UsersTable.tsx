"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Edit2, Trash2, RotateCcw, UserCircle2 } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { Badge } from "@/components/ui/Badge";
import { deleteUser, restoreUser } from "../actions";
import type { User, PaginationMeta } from "@/types";
import { cn } from "@/lib/utils";

const ROLE_VARIANTS: Record<string, "primary" | "secondary" | "warning" | "default" | "success"> =
  {
    admin: "danger" as "primary",
    manager: "primary",
    vendor: "secondary",
    warehouse: "warning",
    accountant: "success",
  };

interface UsersTableProps {
  users: User[];
  meta: PaginationMeta;
  onEdit: (user: User) => void;
}

export function UsersTable({ users, meta, onEdit }: UsersTableProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("common");
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

  const handleDelete = (user: User) => {
    if (!confirm(tc("deleteConfirm"))) return;
    setActionId(user.id);
    startTransition(async () => {
      await deleteUser(user.id);
      setActionId(null);
      router.refresh();
    });
  };

  const handleRestore = (user: User) => {
    setActionId(user.id);
    startTransition(async () => {
      await restoreUser(user.id);
      setActionId(null);
      router.refresh();
    });
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: t("fields.name"),
      render: (user) => (
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary-600">
              {user.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-fg">{user.name}</p>
            <p className="text-xs text-fg-muted">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("fields.role"),
      render: (user) => (
        <Badge variant={ROLE_VARIANTS[user.role] ?? "default"}>
          {t(`roles.${user.role}`)}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: t("fields.phone"),
      render: (user) => (
        <span className="text-sm text-fg-muted">{user.phone ?? "—"}</span>
      ),
    },
    {
      key: "is_active",
      header: tc("status"),
      align: "center",
      render: (user) => (
        <Badge variant={user.is_active ? "success" : "default"}>
          {user.is_active ? tc("active") : tc("inactive")}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: tc("date"),
      render: (user) => (
        <span className="text-sm text-fg-muted">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "w-24",
      render: (user) => {
        const isLoading = isPending && actionId === user.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title={tc("edit")}
            >
              <Edit2 className="size-3.5" />
            </button>
            {user.is_active ? (
              <button
                onClick={() => handleDelete(user)}
                disabled={isLoading}
                className={cn(
                  "p-1.5 rounded-md text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50",
                )}
                title={tc("delete")}
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleRestore(user)}
                disabled={isLoading}
                className="p-1.5 rounded-md text-fg-muted hover:text-success-600 hover:bg-success-50 transition-colors disabled:opacity-50"
                title={t("actions.restore")}
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      meta={meta}
      onPageChange={handlePageChange}
      emptyTitle={t("title")}
      emptyMessage={t("empty")}
    />
  );
}
