"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Eye,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Product, PaginationMeta } from "@/types";
import { archiveProduct, restoreProduct, deleteProduct } from "../actions";
import { cn } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  meta: PaginationMeta;
}

export function ProductTable({ products, meta }: ProductTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [confirmAction, setConfirmAction] = useState<{
    type: "archive" | "restore" | "delete";
    product: Product;
  } | null>(null);

  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    const { type, product } = confirmAction;

    if (type === "archive") await archiveProduct(product.id);
    if (type === "restore") await restoreProduct(product.id);
    if (type === "delete") await deleteProduct(product.id);

    setConfirmAction(null);
    router.refresh();
  };

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: t("products.fields.name"),
      render: (product) => (
        <div className="flex items-center gap-3">
          {/* Product image thumbnail or icon */}
          <div className="size-10 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
            {product.images?.length ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/storage/${product.images[0]}`}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Package className="size-5 text-fg-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-fg truncate">{product.name}</p>
            <p className="text-xs text-fg-muted font-mono">{product.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: t("products.fields.category"),
      render: (product) => (
        <span className="text-sm text-fg-subtle">
          {product.category?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "current_stock",
      header: t("common.quantity"),
      align: "right",
      render: (product) => {
        const stock = product.current_stock ?? 0;
        const threshold = Number(product.stock_alert_threshold ?? 0);
        const isLow = threshold > 0 && stock <= threshold && stock > 0;
        const isOut = stock <= 0;

        return (
          <div className="flex items-center justify-end gap-2">
            {isLow && <AlertTriangle className="size-3.5 text-warning-500" />}
            <span
              className={cn(
                "font-medium tabular-nums",
                isOut && "text-danger-600",
                isLow && "text-warning-600",
                !isOut && !isLow && "text-fg",
              )}
            >
              {Number(stock).toFixed(product.unit_of_measure === "kg" ? 3 : 0)}
            </span>
            <span className="text-xs text-fg-muted">
              {product.unit_of_measure}
            </span>
          </div>
        );
      },
    },
    {
      key: "price_sell_ttc",
      header: t("common.price"),
      align: "right",
      render: (product) => (
        <span className="font-medium tabular-nums text-fg">
          {Number(product.price_sell_ttc).toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{" "}
          <span className="text-xs text-fg-muted">XAF</span>
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      align: "center",
      render: (product) => <StatusBadge status={product.status} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "w-12",
      render: (product) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === product.id ? null : product.id);
            }}
            className="p-1.5 rounded-md hover:bg-surface-muted transition-colors text-fg-muted hover:text-fg"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {openMenu === product.id && (
            <>
              {/* Click-away overlay */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenu(null)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <MenuLink
                  href={`/${locale}/products/${product.id}`}
                  icon={<Eye className="size-4" />}
                  label={t("common.view")}
                  onClick={() => setOpenMenu(null)}
                />
                <MenuLink
                  href={`/${locale}/products/${product.id}/edit`}
                  icon={<Pencil className="size-4" />}
                  label={t("common.edit")}
                  onClick={() => setOpenMenu(null)}
                />
                <div className="h-px bg-border my-1" />
                {product.status === "active" ? (
                  <MenuButton
                    icon={<Archive className="size-4" />}
                    label={t("products.actions.archive")}
                    onClick={() => {
                      setOpenMenu(null);
                      setConfirmAction({ type: "archive", product });
                    }}
                  />
                ) : (
                  <MenuButton
                    icon={<RotateCcw className="size-4" />}
                    label={t("products.actions.restore")}
                    onClick={() => {
                      setOpenMenu(null);
                      setConfirmAction({ type: "restore", product });
                    }}
                  />
                )}
                <MenuButton
                  icon={<Trash2 className="size-4" />}
                  label={t("common.delete")}
                  danger
                  onClick={() => {
                    setOpenMenu(null);
                    setConfirmAction({ type: "delete", product });
                  }}
                />
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={products}
        columns={columns}
        meta={meta}
        onPageChange={handlePageChange}
        emptyTitle={t("nav.products")}
        emptyMessage={t("products.empty")}
      />

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          open
          onClose={() => setConfirmAction(null)}
          onConfirm={handleAction}
          title={
            confirmAction.type === "delete"
              ? t("common.delete")
              : confirmAction.type === "archive"
                ? t("products.actions.archive")
                : t("products.actions.restore")
          }
          description={
            confirmAction.type === "delete"
              ? t("common.deleteConfirm")
              : t("common.archiveConfirm")
          }
          confirmLabel={t("common.confirm")}
          cancelLabel={t("common.cancel")}
          variant={confirmAction.type === "delete" ? "danger" : "primary"}
        />
      )}
    </>
  );
}

// ── Menu sub-components ──────────────────────────────────────────────────────

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-fg hover:bg-surface-muted transition-colors"
    >
      <span className="text-fg-muted">{icon}</span>
      {label}
    </a>
  );
}

function MenuButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left transition-colors",
        danger
          ? "text-danger-600 hover:bg-danger-50"
          : "text-fg hover:bg-surface-muted",
      )}
    >
      <span className={danger ? "text-danger-500" : "text-fg-muted"}>{icon}</span>
      {label}
    </button>
  );
}
