"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Mail, Phone, MapPin, User, Truck, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SupplierModal } from "./SupplierModal";
import { NewOrderModal } from "./NewOrderModal";
import { OrderTimeline } from "./OrderTimeline";
import { ReceiveOrderForm } from "./ReceiveOrderForm";
import { cn } from "@/lib/utils";
import type { Supplier, SupplierSummary, SupplierOrder, Product } from "@/types";

interface SupplierDetailProps {
  supplier: Supplier;
  summary: SupplierSummary;
  orders: SupplierOrder[];
  products: Product[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function SupplierDetail({ supplier, summary, orders, products }: SupplierDetailProps) {
  const t = useTranslations("suppliers");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [editOpen, setEditOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<SupplierOrder | null>(null);

  const statCards = [
    {
      label: t("summary.total_orders"),
      value: String(summary.order_count),
      sub: `${summary.received_count} ${t("summary.received")}`,
      color: "text-primary-600",
      bg: "bg-primary-50 border-primary-100",
      icon: <Package className="size-5" />,
    },
    {
      label: t("summary.pending_orders"),
      value: String(summary.pending_count),
      sub: t("summary.awaiting"),
      color: summary.pending_count > 0 ? "text-warning-600" : "text-fg-muted",
      bg: summary.pending_count > 0 ? "bg-warning-50 border-warning-100" : "bg-surface-muted border-border",
      icon: <Truck className="size-5" />,
    },
    {
      label: t("summary.total_spend"),
      value: `${fmt(summary.total_spend)} F`,
      sub: t("summary.all_time"),
      color: "text-success-600",
      bg: "bg-success-50 border-success-100",
      icon: <TrendingUp className="size-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            <Truck className="size-6 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-fg">{supplier.name}</h1>
              <Badge variant={supplier.is_active ? "success" : "default"}>
                {supplier.is_active ? tc("active") : tc("inactive")}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-fg-muted">
              {supplier.contact_person && (
                <span className="flex items-center gap-1.5">
                  <User className="size-3.5" /> {supplier.contact_person}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {supplier.email}
                </span>
              )}
              {supplier.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {supplier.phone}
                </span>
              )}
              {supplier.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {supplier.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<Edit2 className="size-4" />}
            onClick={() => setEditOpen(true)}
          >
            {tc("edit")}
          </Button>
          <Button
            icon={<Plus className="size-4" />}
            onClick={() => setNewOrderOpen(true)}
          >
            {t("actions.new_order")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={cn("rounded-xl border p-4 flex items-start gap-3", card.bg)}>
            <div className={cn("mt-0.5 shrink-0", card.color)}>{card.icon}</div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">{card.label}</p>
              <p className={cn("text-xl font-bold mt-0.5 tabular-nums truncate", card.color)}>
                {card.value}
              </p>
              <p className="text-xs text-fg-muted mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-fg mb-4">{t("fields.lead_time")}</h2>
          <p className="text-2xl font-bold text-fg tabular-nums">{supplier.lead_time_days}
            <span className="text-sm font-normal text-fg-muted ml-1">{t("details.days")}</span>
          </p>
          {supplier.minimum_order_amount > 0 && (
            <p className="text-sm text-fg-muted mt-2">
              {t("details.min_order")}: <span className="font-medium text-fg">{fmt(supplier.minimum_order_amount)} F</span>
            </p>
          )}
        </div>

        {supplier.notes && (
          <div className="card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-fg mb-3">{tc("notes")}</h2>
            <p className="text-sm text-fg-muted whitespace-pre-wrap">{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-fg">{t("orders.title")}</h2>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="size-3.5" />}
            onClick={() => setNewOrderOpen(true)}
          >
            {t("actions.new_order")}
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="card p-8 text-center text-sm text-fg-muted">{t("orders.empty")}</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderTimeline
                key={order.id}
                order={order}
                onReceive={() => setReceiveOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <SupplierModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        supplier={supplier}
      />

      <NewOrderModal
        open={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        supplier={supplier}
        products={products}
      />

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
