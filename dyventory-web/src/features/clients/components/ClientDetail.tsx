"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit2,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClientSummaryCards } from "./ClientSummaryCards";
import { ClientModal } from "./ClientModal";
import { deleteClient } from "../actions";
import type { Client, ClientSummary, Sale } from "@/types";

interface ClientDetailProps {
  client: Client;
  summary: ClientSummary;
  recentSales: Sale[];
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function ClientDetail({ client, summary, recentSales }: ClientDetailProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    if (!confirm(t("common.deleteConfirm"))) return;
    startTransition(async () => {
      await deleteClient(client.id);
      router.push(`/${locale}/clients`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="card p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary-600">
              {client.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-fg">{client.name}</h1>
              <Badge variant={client.is_active ? "success" : "default"}>
                {client.is_active ? t("common.active") : t("common.inactive")}
              </Badge>
              <Badge variant="secondary">{t(`clients.types.${client.type}`)}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-fg-muted">
              {client.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {client.email}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {client.phone}
                </span>
              )}
              {client.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {client.address}
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
            {t("common.edit")}
          </Button>
          <Button
            variant="danger"
            icon={<XCircle className="size-4" />}
            onClick={handleDelete}
            loading={isPending}
          >
            {t("common.delete")}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <ClientSummaryCards summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
            <Mail className="size-4 text-fg-muted" />
            {t("clients.contact_info")}
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-fg-muted uppercase tracking-wide">{t("clients.fields.email")}</dt>
              <dd className="text-sm text-fg mt-0.5">{client.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted uppercase tracking-wide">{t("clients.fields.phone")}</dt>
              <dd className="text-sm text-fg mt-0.5">{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted uppercase tracking-wide">{t("clients.fields.address")}</dt>
              <dd className="text-sm text-fg mt-0.5">{client.address ?? "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Credit info */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
            <CreditCard className="size-4 text-fg-muted" />
            {t("clients.credit_info")}
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-fg-muted uppercase tracking-wide">{t("clients.fields.credit_limit")}</dt>
              <dd className="text-sm font-semibold text-fg mt-0.5 tabular-nums">{fmt(client.credit_limit)} F</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted uppercase tracking-wide">{t("clients.summary.credit_balance")}</dt>
              <dd className={`text-sm font-semibold mt-0.5 tabular-nums ${client.outstanding_balance > 0 ? "text-warning-600" : "text-fg-muted"}`}>
                {fmt(client.outstanding_balance)} F
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted uppercase tracking-wide">{t("clients.summary.available_credit")}</dt>
              <dd className={`text-sm font-semibold mt-0.5 tabular-nums ${summary.available_credit > 0 ? "text-success-600" : "text-danger-600"}`}>
                {fmt(summary.available_credit)} F
              </dd>
            </div>
          </dl>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-fg mb-3">{t("common.notes")}</h2>
            <p className="text-sm text-fg-muted whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Purchase history */}
      <div className="card">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <ShoppingBag className="size-4 text-fg-muted" />
          <h2 className="text-sm font-semibold text-fg">{t("clients.purchase_history")}</h2>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-8 text-center text-sm text-fg-muted">{t("sales.empty")}</div>
        ) : (
          <div className="divide-y divide-border">
            {recentSales.map((sale) => (
              <Link
                key={sale.id}
                href={`/${locale}/sales/${sale.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                    <ShoppingBag className="size-3.5 text-fg-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium text-fg group-hover:text-primary-600 transition-colors">
                      {sale.sale_number}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {new Date(sale.created_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-fg">
                      {fmt(sale.total_ttc)} F
                    </p>
                    {parseFloat(sale.amount_due) > 0 && (
                      <p className="text-xs text-warning-600 tabular-nums">
                        {fmt(sale.amount_due)} F due
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <StatusBadge status={sale.status} />
                    <StatusBadge status={sale.payment_status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ClientModal open={editOpen} onClose={() => setEditOpen(false)} client={client} />
    </div>
  );
}
