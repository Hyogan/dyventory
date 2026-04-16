"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Clock,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { sendOrder, confirmOrder, cancelOrder } from "../actions";
import type { SupplierOrder, SupplierOrderItem } from "@/types";

interface OrderTimelineProps {
  order: SupplierOrder;
  onReceive: () => void;
}

function fmt(n: number | string) {
  return Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function OrderTimeline({ order, onReceive }: OrderTimelineProps) {
  const t = useTranslations("suppliers");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const act = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  const canSend = order.status === "draft";
  const canConfirm = order.status === "sent";
  const canReceive = order.status === "confirmed" || order.status === "partially_received";
  const canCancel = order.status !== "received" && order.status !== "cancelled";

  return (
    <div className="card">
      {/* Header */}
      <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Package className="size-5 text-fg-muted" />
          <div>
            <p className="font-mono font-semibold text-fg">{order.order_number}</p>
            <p className="text-xs text-fg-muted">
              {new Date(order.created_at).toLocaleDateString()}
              {order.expected_at && ` · ${t("orders.expected", { date: new Date(order.expected_at).toLocaleDateString() })}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} label={t(`order_status.${order.status}`)} />
          {canSend && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Send className="size-3.5" />}
              onClick={() => act(() => sendOrder(order.id))}
              loading={isPending}
            >
              {t("actions.send_order")}
            </Button>
          )}
          {canConfirm && (
            <Button
              size="sm"
              variant="secondary"
              icon={<CheckCircle2 className="size-3.5" />}
              onClick={() => act(() => confirmOrder(order.id))}
              loading={isPending}
            >
              {t("actions.confirm_order")}
            </Button>
          )}
          {canReceive && (
            <Button
              size="sm"
              icon={<PackageCheck className="size-3.5" />}
              onClick={onReceive}
            >
              {t("actions.receive")}
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="danger"
              icon={<XCircle className="size-3.5" />}
              onClick={() => act(() => cancelOrder(order.id))}
              loading={isPending}
            >
              {t("actions.cancel_order")}
            </Button>
          )}
        </div>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div>
          <div className="px-5 py-3 bg-surface-muted/40 border-b border-border">
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">
              {t("orders.items")} ({order.items.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {order.items.map((item: SupplierOrderItem) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-7 rounded-md bg-surface-muted border border-border flex items-center justify-center shrink-0">
                    <Package className="size-3.5 text-fg-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {item.product?.name ?? `Product #${item.product_id}`}
                    </p>
                    {item.product?.sku && (
                      <p className="text-xs text-fg-muted">{item.product.sku}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-fg-muted">{t("orders.ordered")}</p>
                    <p className="font-semibold tabular-nums">{item.quantity_ordered}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-fg-muted">{t("orders.received")}</p>
                    <p className={`font-semibold tabular-nums ${item.quantity_received > 0 ? "text-success-600" : "text-fg-muted"}`}>
                      {item.quantity_received}
                    </p>
                  </div>
                  {item.quantity_remaining > 0 && (
                    <div className="text-center">
                      <p className="text-xs text-fg-muted">{t("orders.remaining")}</p>
                      <p className="font-semibold tabular-nums text-warning-600">
                        {item.quantity_remaining}
                      </p>
                    </div>
                  )}
                  <div className="text-right min-w-[80px]">
                    <p className="text-xs text-fg-muted">{t("orders.unit_price")}</p>
                    <p className="font-semibold tabular-nums">{fmt(item.unit_price_ht)} F</p>
                  </div>
                  <div className="text-right min-w-[90px]">
                    <p className="text-xs text-fg-muted">{t("orders.total")}</p>
                    <p className="font-semibold tabular-nums">{fmt(item.line_total_ht)} F</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border flex justify-end">
            <p className="text-sm font-semibold text-fg">
              {t("orders.total")}: <span className="tabular-nums">{fmt(order.total_amount)} F</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
