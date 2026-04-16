"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { deleteVatRate } from "../actions";
import type { VatRate } from "@/types";

interface VatRatesTableProps {
  vatRates: VatRate[];
  onEdit: (vatRate: VatRate) => void;
}

export function VatRatesTable({ vatRates, onEdit }: VatRatesTableProps) {
  const t = useTranslations("admin.settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<number | null>(null);

  const handleDelete = (vatRate: VatRate) => {
    if (!confirm(tc("deleteConfirm"))) return;
    setActionId(vatRate.id);
    startTransition(async () => {
      const result = await deleteVatRate(vatRate.id);
      if (!result.success) {
        alert(result.message);
      }
      setActionId(null);
      router.refresh();
    });
  };

  if (vatRates.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center text-sm text-fg-muted">
        No VAT rates configured.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-fg-subtle">Name</th>
            <th className="px-4 py-3 text-right font-medium text-fg-subtle">Rate</th>
            <th className="px-4 py-3 text-center font-medium text-fg-subtle">Default</th>
            <th className="px-4 py-3 text-center font-medium text-fg-subtle">{tc("status")}</th>
            <th className="px-4 py-3 text-right font-medium text-fg-subtle w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {vatRates.map((vr) => (
            <tr key={vr.id} className="hover:bg-surface-muted/40 transition-colors">
              <td className="px-4 py-3 font-medium text-fg">{vr.name}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-fg">
                {parseFloat(vr.rate).toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-center">
                {vr.is_default && (
                  <Star className="size-4 text-warning-500 fill-warning-300 mx-auto" />
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={vr.is_active ? "success" : "default"}>
                  {vr.is_active ? tc("active") : tc("inactive")}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(vr)}
                    className="p-1.5 rounded-md text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title={tc("edit")}
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(vr)}
                    disabled={isPending && actionId === vr.id}
                    className="p-1.5 rounded-md text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
                    title={tc("delete")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
