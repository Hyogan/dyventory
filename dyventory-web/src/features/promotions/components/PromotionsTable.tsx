"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Tag, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/Pagination";
import { deletePromotion } from "../actions";
import type { Promotion, PaginationMeta } from "@/types";

interface PromotionsTableProps {
  promotions: Promotion[];
  meta: PaginationMeta;
  onEdit: (p: Promotion) => void;
}

function StatusBadge({ p }: { p: Promotion }) {
  const t = useTranslations("promotions.status");
  const now = new Date();
  const start = new Date(p.starts_at);
  const end   = new Date(p.ends_at);

  if (!p.is_active) {
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-surface-hover text-fg-muted border-border"><XCircle className="size-3" />{t("inactive")}</span>;
  }
  if (now < start) {
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-100"><Clock className="size-3" />{t("scheduled")}</span>;
  }
  if (now > end) {
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-danger-50 text-danger-700 border-danger-100"><XCircle className="size-3" />{t("expired")}</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-success-50 text-success-700 border-success-100"><CheckCircle2 className="size-3" />{t("running")}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const t = useTranslations("promotions.types");
  const styles: Record<string, string> = {
    percentage:  "bg-violet-50 text-violet-700 border-violet-100",
    fixed_value: "bg-amber-50 text-amber-700 border-amber-100",
    bundle:      "bg-primary-50 text-primary-700 border-primary-100",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", styles[type] ?? "")}>
      <Tag className="size-3" />
      {t(type as "percentage" | "fixed_value" | "bundle")}
    </span>
  );
}

export function PromotionsTable({ promotions, meta, onEdit }: PromotionsTableProps) {
  const t  = useTranslations("promotions");
  const tc = useTranslations("common");
  const [isPending, start] = useTransition();
  const router = useRouter();

  const handleDelete = (p: Promotion) => {
    if (!confirm(tc("deleteConfirm"))) return;
    start(async () => {
      await deletePromotion(p.id);
      router.refresh();
    });
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString();

  if (promotions.length === 0) {
    return <p className="text-center text-sm text-fg-muted py-16">{t("empty")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover">
              {[t("fields.name"), t("fields.type"), t("fields.value"), t("fields.starts_at"), t("fields.ends_at"), tc("status"), tc("actions")].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {promotions.map((p) => (
              <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3 font-medium text-fg">{p.name}</td>
                <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                <td className="px-4 py-3 tabular-nums font-medium text-fg">{p.discount_label}</td>
                <td className="px-4 py-3 text-fg-muted">{fmtDate(p.starts_at)}</td>
                <td className="px-4 py-3 text-fg-muted">{fmtDate(p.ends_at)}</td>
                <td className="px-4 py-3"><StatusBadge p={p} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1.5 rounded hover:bg-primary-50 hover:text-primary-700 text-fg-muted transition-colors"
                      title={tc("edit")}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={isPending}
                      className="p-1.5 rounded hover:bg-danger-50 hover:text-danger-700 text-fg-muted transition-colors disabled:opacity-40"
                      title={tc("delete")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} />
    </div>
  );
}
