"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createSupplier, updateSupplier } from "../actions";
import type { Supplier } from "@/types";

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

interface FormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  lead_time_days: string;
  minimum_order_amount: string;
  notes: string;
  is_active: boolean;
}

const DEFAULT_FORM: FormData = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  lead_time_days: "7",
  minimum_order_amount: "0",
  notes: "",
  is_active: true,
};

export function SupplierModal({ open, onClose, supplier }: SupplierModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isEdit = !!supplier;

  const [form, setForm] = useState<FormData>(() =>
    supplier
      ? {
          name: supplier.name,
          contact_person: supplier.contact_person ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          lead_time_days: String(supplier.lead_time_days),
          minimum_order_amount: String(supplier.minimum_order_amount),
          notes: supplier.notes ?? "",
          is_active: supplier.is_active,
        }
      : DEFAULT_FORM,
  );

  const set = (key: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        name: form.name,
        contact_person: form.contact_person || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        lead_time_days: parseInt(form.lead_time_days) || 7,
        minimum_order_amount: parseFloat(form.minimum_order_amount) || 0,
        notes: form.notes || null,
        is_active: form.is_active,
      };

      const result = isEdit
        ? await updateSupplier(supplier!.id, payload)
        : await createSupplier(payload);

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
      title={isEdit ? t("suppliers.edit.title") : t("suppliers.create.title")}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {isEdit ? t("common.update") : t("common.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="label">
            {t("suppliers.fields.name")} <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input mt-1"
            placeholder="Supplier Inc."
          />
          {errors.name && <p className="text-xs text-danger-600 mt-1">{errors.name[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Contact person */}
          <div>
            <label className="label">{t("suppliers.fields.contact")}</label>
            <input
              type="text"
              value={form.contact_person}
              onChange={(e) => set("contact_person", e.target.value)}
              className="input mt-1"
              placeholder="Jane Smith"
            />
          </div>

          {/* Email */}
          <div>
            <label className="label">{t("suppliers.fields.email")}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="input mt-1"
              placeholder="supplier@example.com"
            />
            {errors.email && <p className="text-xs text-danger-600 mt-1">{errors.email[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label className="label">{t("suppliers.fields.phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="input mt-1"
              placeholder="+229 00 00 00 00"
            />
          </div>

          {/* Lead time */}
          <div>
            <label className="label">{t("suppliers.fields.lead_time")}</label>
            <input
              type="number"
              min="0"
              value={form.lead_time_days}
              onChange={(e) => set("lead_time_days", e.target.value)}
              className="input mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Min order */}
          <div>
            <label className="label">{t("suppliers.fields.min_order")}</label>
            <input
              type="number"
              min="0"
              step="100"
              value={form.minimum_order_amount}
              onChange={(e) => set("minimum_order_amount", e.target.value)}
              className="input mt-1"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label">{t("suppliers.fields.address")}</label>
          <textarea
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="input mt-1 min-h-[70px] resize-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">{t("common.notes")}</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="input mt-1 min-h-[70px] resize-none"
          />
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="size-4 rounded accent-primary-600"
          />
          <span className="text-sm text-fg">{t("common.active")}</span>
        </label>
      </div>
    </Modal>
  );
}
