"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Plus,
  User,
  Package,
  CreditCard,
  Clock,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddPaymentModal } from "./AddPaymentModal";
import { confirmSale, cancelSale, deliverSale } from "../actions";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types";

interface SaleDetailProps {
  sale: Sale;
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SaleDetail({ sale: initialSale }: SaleDetailProps) {
  const t = useTranslations("sales");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sale, setSale] = useState(initialSale);

  const act = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  const canConfirm = sale.status === "draft";
  const canCancel = sale.status === "draft" || sale.status === "confirmed";
  const canDeliver = sale.status === "confirmed";
  const canReturn = sale.status === "confirmed" || sale.status === "delivered";
  const canPay = parseFloat(sale.amount_due) > 0 && sale.status !== "cancelled";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Status + actions bar ─────────────────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Receipt className="size-5 text-fg-muted shrink-0" />
          <span className="font-mono font-semibold text-fg text-lg">
            {sale.sale_number}
          </span>
          <StatusBadge status={sale.status} />
          <StatusBadge status={sale.payment_status} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canPay && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="size-3.5" />}
              onClick={() => setShowPaymentModal(true)}
            >
              {t("actions.add_payment")}
            </Button>
          )}
          {canConfirm && (
            <Button
              size="sm"
              variant="secondary"
              icon={<CheckCircle2 className="size-3.5" />}
              loading={isPending}
              onClick={() => act(() => confirmSale(sale.id))}
            >
              {t("actions.confirm")}
            </Button>
          )}
          {canDeliver && (
            <Button
              size="sm"
              variant="outline"
              icon={<Truck className="size-3.5" />}
              loading={isPending}
              onClick={() => act(() => deliverSale(sale.id))}
            >
              Mark delivered
            </Button>
          )}
          {canReturn && (
            <Link href={`/${locale}/sales/${sale.id}/return`}>
              <Button
                size="sm"
                variant="outline"
                icon={<RotateCcw className="size-3.5" />}
              >
                {t("actions.return")}
              </Button>
            </Link>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="danger"
              icon={<XCircle className="size-3.5" />}
              loading={isPending}
              onClick={() => {
                if (!confirm(`Cancel sale ${sale.sale_number}?`)) return;
                act(() => cancelSale(sale.id));
              }}
            >
              {t("actions.cancel")}
            </Button>
          )}
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT — Items + financials */}
        <div className="lg:col-span-3 space-y-5">
          {/* Items table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-semibold text-fg">{t("detail.items_title")}</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-subtle">Product</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-fg-subtle">Qty</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-fg-subtle">Unit (TTC)</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-fg-subtle">Disc.</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-fg-subtle">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(sale.items ?? []).map((item) => (
                  <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-md bg-surface-muted border border-border flex items-center justify-center shrink-0">
                          <Package className="size-3.5 text-fg-muted" />
                        </div>
                        <div>
                          <p className="font-medium text-fg">
                            {item.product?.name ?? `Product #${item.product_id}`}
                          </p>
                          {item.product?.sku && (
                            <p className="text-xs font-mono text-fg-muted">{item.product.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg">
                      {parseFloat(item.quantity).toLocaleString("fr-FR", { maximumFractionDigits: 3 })}
                      <span className="text-xs text-fg-muted ml-1">
                        {item.product?.unit_of_measure}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg">
                      {fmt(item.unit_price_ttc)} F
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg-muted text-xs">
                      {parseFloat(item.discount_percent) > 0
                        ? `−${item.discount_percent}%`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-fg">
                      {fmt(item.line_total_ttc)} F
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financials footer */}
            <div className="border-t border-border px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-fg-muted">
                <span>{t("fields.subtotal")}</span>
                <span className="tabular-nums">{fmt(sale.subtotal_ht)} F</span>
              </div>
              <div className="flex justify-between text-sm text-fg-muted">
                <span>{t("fields.vat")}</span>
                <span className="tabular-nums">{fmt(sale.total_vat)} F</span>
              </div>
              {parseFloat(sale.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-success-600">
                  <span>{t("fields.discount")}</span>
                  <span className="tabular-nums">−{fmt(sale.discount_amount)} F</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-fg pt-2 border-t border-border">
                <span>{t("fields.total")}</span>
                <span className="tabular-nums text-lg">{fmt(sale.total_ttc)} F</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-fg-muted">{t("fields.amount_paid")}</span>
                <span className="tabular-nums text-success-600 font-medium">
                  {fmt(sale.amount_paid)} F
                </span>
              </div>
              {parseFloat(sale.amount_due) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-fg-muted">{t("fields.amount_due")}</span>
                  <span className="tabular-nums text-warning-600 font-semibold">
                    {fmt(sale.amount_due)} F
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="card px-5 py-4">
              <p className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-fg">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT — Meta + payments + returns */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client card */}
          <div className="card p-5">
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">
              {t("fields.client")}
            </p>
            {sale.client ? (
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center shrink-0">
                  <User className="size-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-fg">{sale.client.name}</p>
                  {sale.client.email && (
                    <p className="text-xs text-fg-muted mt-0.5">{sale.client.email}</p>
                  )}
                  {sale.client.phone && (
                    <p className="text-xs text-fg-muted">{sale.client.phone}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <User className="size-4" />
                <span>Anonymous / Walk-in</span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted flex items-center gap-1.5">
                  <CreditCard className="size-3.5" />
                  {t("fields.payment_method")}
                </span>
                <span className="font-medium text-fg capitalize">
                  {sale.payment_method
                    ? sale.payment_method.replace(/_/g, " ")
                    : "—"}
                </span>
              </div>
              {sale.due_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg-muted flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {t("fields.due_date")}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      new Date(sale.due_date) < new Date()
                        ? "text-danger-600"
                        : "text-fg",
                    )}
                  >
                    {new Date(sale.due_date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-fg-muted">
                <span>Created by {sale.user?.name}</span>
                <span>{fmtDate(sale.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          <div className="card p-5">
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">
              {t("detail.payment_history")}
            </p>
            {(sale.payments ?? []).length === 0 ? (
              <p className="text-sm text-fg-muted">{t("detail.no_payments")}</p>
            ) : (
              <ul className="space-y-3">
                {(sale.payments ?? []).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-success-100 flex items-center justify-center">
                        <CheckCircle2 className="size-3.5 text-success-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-fg capitalize">
                          {p.payment_method.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {new Date(p.paid_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <span className="tabular-nums text-sm font-semibold text-success-600">
                      +{fmt(p.amount)} F
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Returns */}
          {(sale.returns ?? []).length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">
                {t("detail.returns_title")}
              </p>
              <ul className="space-y-3">
                {(sale.returns ?? []).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-fg capitalize">
                        {r.resolution.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-fg-muted mt-0.5">{r.reason}</p>
                    </div>
                    {parseFloat(r.refund_amount) > 0 && (
                      <span className="tabular-nums text-warning-600 font-medium">
                        −{fmt(r.refund_amount)} F
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      <AddPaymentModal
        sale={sale}
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}
