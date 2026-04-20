"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createPromotion, updatePromotion } from "../actions";
import type { Promotion } from "@/types";

interface PromotionModalProps {
  open: boolean;
  promotion?: Promotion | null;
  onClose: () => void;
}

const DEFAULT_FORM = {
  name: "",
  type: "percentage" as "percentage" | "fixed_value" | "bundle",
  value: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
  min_quantity: "",
};

export function PromotionModal({ open, promotion, onClose }: PromotionModalProps) {
  const t  = useTranslations("promotions");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (promotion) {
      const toLocal = (s: string) => {
        // Convert ISO date to datetime-local input value
        return s ? s.slice(0, 16) : "";
      };
      setForm({
        name: promotion.name,
        type: promotion.type,
        value: String(promotion.value),
        starts_at: toLocal(promotion.starts_at),
        ends_at: toLocal(promotion.ends_at),
        is_active: promotion.is_active,
        min_quantity: String(promotion.conditions?.min_quantity ?? ""),
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
    setGlobalError(null);
  }, [promotion, open]);

  const set = (field: keyof typeof DEFAULT_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const payload = {
      name: form.name,
      type: form.type,
      value: parseFloat(form.value),
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      is_active: form.is_active,
      conditions: form.min_quantity
        ? { min_quantity: parseInt(form.min_quantity, 10) }
        : null,
    };

    startTransition(async () => {
      const result = promotion
        ? await updatePromotion(promotion.id, payload)
        : await createPromotion(payload);

      if (result.success) {
        onClose();
        router.refresh();
      } else {
        if (result.errors) setErrors(result.errors);
        setGlobalError(result.message ?? tc("error"));
      }
    });
  };

  const field = (label: string, key: keyof typeof DEFAULT_FORM, node: React.ReactNode, hint?: string) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-fg">{label}</label>
      {node}
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
      {errors[key]?.map((e) => (
        <p key={e} className="text-xs text-danger-600">{e}</p>
      ))}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={promotion ? t("edit") : t("create")}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {globalError && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            <AlertCircle className="size-4 shrink-0" />
            {globalError}
          </div>
        )}

        {/* Name */}
        {field(
          t("fields.name"),
          "name",
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            required
            className="input w-full"
            placeholder={t("fields.name")}
          />,
        )}

        {/* Type */}
        {field(
          t("fields.type"),
          "type",
          <select value={form.type} onChange={set("type")} required className="input w-full">
            <option value="percentage">{t("types.percentage")}</option>
            <option value="fixed_value">{t("types.fixed_value")}</option>
            <option value="bundle">{t("types.bundle")}</option>
          </select>,
        )}

        {/* Value */}
        {field(
          t("fields.value"),
          "value",
          <input
            type="number"
            value={form.value}
            onChange={set("value")}
            required
            min={0}
            step="0.01"
            className="input w-full"
            placeholder={form.type === "percentage" ? "e.g. 10" : "e.g. 500"}
          />,
          form.type === "percentage" ? t("hints.percentage") : undefined,
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          {field(
            t("fields.starts_at"),
            "starts_at",
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={set("starts_at")}
              required
              className="input w-full"
            />,
          )}
          {field(
            t("fields.ends_at"),
            "ends_at",
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={set("ends_at")}
              required
              className="input w-full"
            />,
          )}
        </div>

        {/* Min quantity (optional condition) */}
        {field(
          t("fields.min_quantity"),
          "min_quantity",
          <input
            type="number"
            value={form.min_quantity}
            onChange={set("min_quantity")}
            min={1}
            step={1}
            className="input w-full"
            placeholder={t("hints.min_quantity_optional")}
          />,
        )}

        {/* Is active */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={set("is_active")}
            className="size-4 accent-primary-600"
          />
          <span className="text-sm text-fg">{t("fields.is_active")}</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {tc("cancel")}
          </Button>
          <Button type="submit" loading={isPending}>
            {promotion ? tc("save") : tc("create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
