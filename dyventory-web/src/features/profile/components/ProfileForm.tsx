"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Save, User as UserIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "../actions";
import type { User } from "@/types";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("admin.profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg(null);

    startTransition(async () => {
      const payload: Parameters<typeof updateProfile>[0] = {
        name,
        email,
        phone: phone || null,
      };

      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }

      const result = await updateProfile(payload);

      if (result.success) {
        setSuccessMsg(t("saved"));
        setPassword("");
        setPasswordConfirmation("");
        router.refresh();
      } else {
        setErrors(result.errors ?? {});
      }
    });
  };

  const fieldError = (key: string) =>
    errors[key]?.[0] ? (
      <p className="mt-1 text-xs text-danger-600">{errors[key][0]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal info */}
      <div className="card">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <UserIcon className="size-4 text-fg-muted" />
          <h2 className="text-sm font-semibold text-fg">{t("personal_info")}</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">{t("fields.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input mt-1"
            />
            {fieldError("name")}
          </div>
          <div>
            <label className="label">{t("fields.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input mt-1"
            />
            {fieldError("email")}
          </div>
          <div>
            <label className="label">{t("fields.phone")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input mt-1"
            />
            {fieldError("phone")}
          </div>
          <div className="flex items-end">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted text-sm text-fg-muted">
              <span className="capitalize font-medium text-fg">{user.role}</span>
              <span>·</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password change */}
      <div className="card">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Lock className="size-4 text-fg-muted" />
          <h2 className="text-sm font-semibold text-fg">{t("change_password")}</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">{t("fields.password")}</label>
            <p className="text-xs text-fg-muted mb-1">{t("fields.current_password_hint")}</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="input"
            />
            {fieldError("password")}
          </div>
          <div>
            <label className="label">{t("fields.password_confirmation")}</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
              className="input mt-6"
            />
            {fieldError("password_confirmation")}
          </div>
        </div>
      </div>

      {successMsg && (
        <p className="text-sm text-success-600 font-medium">{successMsg}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          icon={<Save className="size-4" />}
          loading={isPending}
        >
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}
