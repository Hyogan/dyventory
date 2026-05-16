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
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { DataTable, type Column } from "@/components/shared/Datatable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Product, PaginationMeta } from "@/types";
import { archiveProduct, restoreProduct, deleteProduct } from "../actions";
import { useProductsLoading } from "./ProductsLoadingContext";
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
  const { isPending } = useProductsLoading();

  const [confirmAction, setConfirmAction] = useState<{
    type: "archive" | "restore" | "delete";
    product: Product;
  } | null>(null);

  const [openMenu, setOpenMenu] = useState<{
    id: number;
    top: number;
    right: number;
  } | null>(null);

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
        <div className="flex items-center gap-4 py-1 group/item">
          {/* DEPTH: Inset shadow makes the container look carved into the row */}
          <div className="size-20 rounded-2xl bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200/50 flex items-center justify-center shrink-0 overflow-hidden transition-transform group-hover/item:scale-105">
            {product.images?.length ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/storage/${product.images[0]}`}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Package className="size-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <p className="font-bold text-slate-900 truncate tracking-tight">
              {product.name}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {product.sku}
            </p>
          </div>
        </div>
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
          <div className="flex items-center justify-end">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold tabular-nums shadow-sm",
                isOut && "bg-rose-50 border-rose-100 text-rose-600",
                isLow &&
                  "bg-amber-50 border-amber-100 text-amber-600 shadow-amber-100/50",
                !isOut &&
                  !isLow &&
                  "bg-slate-50 border-slate-200 text-slate-700",
              )}
            >
              {isLow && <AlertTriangle className="size-3.5" />}
              <span>
                {Number(stock).toFixed(
                  product.unit_of_measure === "kg" ? 3 : 0,
                )}
              </span>
              <span className="text-[10px] opacity-60 uppercase">
                {product.unit_of_measure}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "price_sell_ttc",
      header: t("common.price"),
      align: "right",
      render: (product) => (
        <div className="flex flex-col items-end">
          <span className="text-base font-black text-slate-900 tabular-nums tracking-tight">
            {Number(product.price_sell_ttc).toLocaleString(locale)}
          </span>
          <span className="text-[10px] font-bold text-slate-400">XAF</span>
        </div>
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
              if (openMenu?.id === product.id) {
                setOpenMenu(null);
              } else {
                const rect = (
                  e.currentTarget as HTMLButtonElement
                ).getBoundingClientRect();
                setOpenMenu({
                  id: product.id,
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
              }
            }}
            className={cn(
              "p-2 rounded-xl transition-all duration-200 border",
              openMenu?.id === product.id
                ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-110"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-900 shadow-sm active:scale-95",
            )}
          >
            <MoreHorizontal className="size-5" />
          </button>

          {openMenu?.id === product.id && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenu(null)}
              />
              {/* GLASSMORPHISM: Backdrop blur and white transparency */}
              <div
                className="fixed z-20 w-56 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                style={{ top: openMenu.top, right: openMenu.right }}
              >
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
                <div className="h-px bg-slate-100 my-1.5 mx-2" />
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
    <div className="bg-slate-50/50  rounded-[2rem] border border-slate-200/60 shadow-sm">
      <DataTable
        data={products}
        columns={columns}
        loading={isPending}
        meta={meta}
        onPageChange={handlePageChange}
        emptyTitle={t("nav.products")}
        emptyMessage={t("products.empty")}
        // {/* TABLE LOGIC: Using border-separate creates the "floating slab" look for rows */}
        className="border-separate border-spacing-y-3"
      />

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
    </div>
  );
}

// ── Refined Menu Components ──────────────────────────────────────────────────

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
      className="flex items-center justify-between group px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all mx-1"
    >
      <div className="flex items-center gap-3">
        <span className="text-slate-400 group-hover:scale-110 transition-transform">
          {icon}
        </span>
        {label}
      </div>
      <ChevronRight className="size-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
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
        "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold w-full text-left transition-all rounded-xl mx-1 w-[calc(100%-8px)]",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <span className={cn(danger ? "text-rose-500" : "text-slate-400")}>
        {icon}
      </span>
      {label}
    </button>
  );
}
