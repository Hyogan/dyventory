"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createVatRate, updateVatRate } from "../actions";
import type { VatRate } from "@/types";

interface VatRateModalProps {
  open: boolean;
  onClose: () => void;
  vatRate?: VatRate | null;
}

export function VatRateModal({ open, onClose, vatRate }: VatRateModalProps) {
  const t = useTranslations("admin.vat_rates");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isEdit = !!vatRate;

  const [form, setForm] = useState(() =>
    vatRate
      ? { name: vatRate.name, rate: vatRate.rate, is_default: vatRate.is_default, is_active: vatRate.is_active }
      : { name: "", rate: "0", is_default: false, is_active: true },
  );

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = isEdit
        ? await updateVatRate(vatRate!.id, form)
        : await createVatRate(form);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setErrors(result.errors ?? {});
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("edit") : t("create")}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>{tc("cancel")}</Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {isEdit ? tc("update") : tc("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">{t("fields.name")} <span className="text-danger-500">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input mt-1"
            placeholder="Standard VAT"
          />
          {errors.name && <p className="text-xs text-danger-600 mt-1">{errors.name[0]}</p>}
        </div>

        <div>
          <label className="label">{t("fields.rate")} <span className="text-danger-500">*</span></label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.rate}
            onChange={(e) => set("rate", e.target.value)}
            className="input mt-1"
          />
          {errors.rate && <p className="text-xs text-danger-600 mt-1">{errors.rate[0]}</p>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => set("is_default", e.target.checked)}
              className="size-4 rounded accent-primary-600"
            />
            <span className="text-sm text-fg">Default rate</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="size-4 rounded accent-primary-600"
            />
            <span className="text-sm text-fg">{tc("active")}</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
