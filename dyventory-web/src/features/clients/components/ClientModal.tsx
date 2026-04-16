"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createClient, updateClient } from "../actions";
import type { Client } from "@/types";

const CLIENT_TYPES = ["individual", "company", "reseller", "wholesaler", "retailer"] as const;

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  type: string;
  credit_limit: string;
  notes: string;
  is_active: boolean;
}

const DEFAULT_FORM: FormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  type: "individual",
  credit_limit: "0",
  notes: "",
  is_active: true,
};

export function ClientModal({ open, onClose, client }: ClientModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isEdit = !!client;

  const [form, setForm] = useState<FormData>(() =>
    client
      ? {
          name: client.name,
          email: client.email ?? "",
          phone: client.phone ?? "",
          address: client.address ?? "",
          type: client.type,
          credit_limit: String(client.credit_limit),
          notes: client.notes ?? "",
          is_active: client.is_active,
        }
      : DEFAULT_FORM,
  );

  // Reset form when client changes
  const handleOpen = () => {
    if (client) {
      setForm({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
        type: client.type,
        credit_limit: String(client.credit_limit),
        notes: client.notes ?? "",
        is_active: client.is_active,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  };

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
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        type: form.type,
        credit_limit: parseFloat(form.credit_limit) || 0,
        notes: form.notes || null,
        is_active: form.is_active,
      };

      const result = isEdit
        ? await updateClient(client!.id, payload)
        : await createClient(payload);

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
      onClose={() => { onClose(); handleOpen(); }}
      title={isEdit ? t("clients.edit.title") : t("clients.create.title")}
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
            {t("clients.fields.name")} <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input mt-1"
            placeholder="John Doe / Acme Corp"
          />
          {errors.name && (
            <p className="text-xs text-danger-600 mt-1">{errors.name[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="label">{t("clients.fields.type")}</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="input-select mt-1"
            >
              {CLIENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`clients.types.${type}`)}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-xs text-danger-600 mt-1">{errors.type[0]}</p>
            )}
          </div>

          {/* Credit limit */}
          <div>
            <label className="label">{t("clients.fields.credit_limit")}</label>
            <input
              type="number"
              min="0"
              step="100"
              value={form.credit_limit}
              onChange={(e) => set("credit_limit", e.target.value)}
              className="input mt-1"
            />
            {errors.credit_limit && (
              <p className="text-xs text-danger-600 mt-1">{errors.credit_limit[0]}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="label">{t("clients.fields.email")}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="input mt-1"
              placeholder="client@example.com"
            />
            {errors.email && (
              <p className="text-xs text-danger-600 mt-1">{errors.email[0]}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="label">{t("clients.fields.phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="input mt-1"
              placeholder="+229 00 00 00 00"
            />
            {errors.phone && (
              <p className="text-xs text-danger-600 mt-1">{errors.phone[0]}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label">{t("clients.fields.address")}</label>
          <textarea
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="input mt-1 min-h-[80px] resize-none"
            placeholder="123 Main St, Cotonou"
          />
          {errors.address && (
            <p className="text-xs text-danger-600 mt-1">{errors.address[0]}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label">{t("clients.fields.notes")}</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="input mt-1 min-h-[70px] resize-none"
            placeholder={t("common.optional")}
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
          <span className="text-sm text-fg">{t("clients.fields.is_active")}</span>
        </label>
      </div>
    </Modal>
  );
}
