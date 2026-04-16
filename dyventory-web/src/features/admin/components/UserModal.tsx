"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createUser, updateUser } from "../actions";
import type { User, UserRole } from "@/types";

const ROLES: UserRole[] = ["admin", "manager", "vendor", "warehouse", "accountant"];

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}

interface FormData {
  name: string;
  email: string;
  role: string;
  phone: string;
  password: string;
  password_confirmation: string;
  is_active: boolean;
}

const DEFAULT_FORM: FormData = {
  name: "",
  email: "",
  role: "vendor",
  phone: "",
  password: "",
  password_confirmation: "",
  is_active: true,
};

export function UserModal({ open, onClose, user }: UserModalProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isEdit = !!user;

  const [form, setForm] = useState<FormData>(() =>
    user
      ? {
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone ?? "",
          password: "",
          password_confirmation: "",
          is_active: user.is_active,
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
      let result;

      if (isEdit) {
        const payload: Parameters<typeof updateUser>[1] = {
          name: form.name,
          email: form.email,
          role: form.role as UserRole,
          phone: form.phone || null,
          is_active: form.is_active,
        };
        if (form.password) {
          payload.password = form.password;
          payload.password_confirmation = form.password_confirmation;
        }
        result = await updateUser(user!.id, payload);
      } else {
        result = await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          role: form.role,
          phone: form.phone || null,
          is_active: form.is_active,
        });
      }

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
      title={isEdit ? t("edit_title") : t("create")}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {isEdit ? tc("update") : tc("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">
            {t("fields.name")} <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input mt-1"
            placeholder="John Smith"
          />
          {errors.name && <p className="text-xs text-danger-600 mt-1">{errors.name[0]}</p>}
        </div>

        <div>
          <label className="label">
            {t("fields.email")} <span className="text-danger-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="input mt-1"
            placeholder="user@example.com"
          />
          {errors.email && <p className="text-xs text-danger-600 mt-1">{errors.email[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t("fields.role")}</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="input-select mt-1"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="input mt-1"
              placeholder="+229..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              {t("fields.password")}
              {isEdit && <span className="text-fg-muted text-xs ml-1">(leave blank to keep)</span>}
              {!isEdit && <span className="text-danger-500"> *</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="input mt-1"
              autoComplete="new-password"
            />
            {errors.password && <p className="text-xs text-danger-600 mt-1">{errors.password[0]}</p>}
          </div>
          <div>
            <label className="label">{t("fields.password_confirmation")}</label>
            <input
              type="password"
              value={form.password_confirmation}
              onChange={(e) => set("password_confirmation", e.target.value)}
              className="input mt-1"
              autoComplete="new-password"
            />
          </div>
        </div>

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
    </Modal>
  );
}
