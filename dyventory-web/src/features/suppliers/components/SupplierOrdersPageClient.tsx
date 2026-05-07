"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { OrderTimeline } from "./OrderTimeline";
import { ReceiveOrderForm } from "./ReceiveOrderForm";
import { Pagination } from "@/components/shared/Pagination";
import type { SupplierOrder, PaginationMeta, Supplier } from "@/types";

interface SupplierOrdersPageClientProps {
  orders: SupplierOrder[];
  meta: PaginationMeta;
  suppliers: Supplier[];
}

const STATUS_OPTIONS = [
  "draft",
  "sent",
  "confirmed",
  "partially_received",
  "received",
  "cancelled",
] as const;

export function SupplierOrdersPageClient({
  orders,
  meta,
  suppliers,
}: SupplierOrdersPageClientProps) {
  const t = useTranslations("suppliers");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [receiveOrder, setReceiveOrder] = useState<SupplierOrder | null>(null);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentStatus = searchParams.get("status") ?? "";
  const currentSupplier = searchParams.get("supplier_id") ?? "";

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentStatus}
          onChange={(e) => updateParam("status", e.target.value)}
          className="input h-9 text-sm w-44"
        >
          <option value="">{tc("all")} statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`order_status.${s}`)}
            </option>
          ))}
        </select>
        <select
          value={currentSupplier}
          onChange={(e) => updateParam("supplier_id", e.target.value)}
          className="input h-9 text-sm w-52"
        >
          <option value="">{tc("all")} suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Order list */}
      {orders.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <ShoppingCart className="size-10 text-fg-muted" />
          <p className="text-sm text-fg-muted">{t("orders.empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id}>
              {/* Supplier name header above each order */}
              {order.supplier && (
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5 px-1">
                  {order.supplier.name}
                </p>
              )}
              <OrderTimeline
                order={order}
                onReceive={() => setReceiveOrder(order)}
              />
            </div>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <Pagination
          meta={meta}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", String(page));
            router.push(`${pathname}?${params.toString()}`);
          }}
        />
      )}

      {receiveOrder && (
        <ReceiveOrderForm
          open
          onClose={() => setReceiveOrder(null)}
          order={receiveOrder}
        />
      )}
    </div>
  );
}
