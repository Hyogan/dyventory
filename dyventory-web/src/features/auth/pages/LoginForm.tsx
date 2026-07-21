"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LoginFormState } from "@/types/auth";
import { cn } from "@/lib/utils";
import { loginAction } from "../actions/login";

const initialState: LoginFormState = { error: null };

// ── Floating-label input ───────────────────────────────────────────
interface FieldProps {
  id: string;
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  suffix?: React.ReactNode;
}

function FloatingField({
  id,
  label,
  name,
  type = "text",
  value,
  onChange,
  autoComplete,
  autoFocus,
  required,
  disabled,
  invalid,
  describedBy,
  suffix,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div
      className={cn(
        "relative h-14 rounded-lg border bg-surface-card transition-colors duration-150",
        "focus-within:ring-[3px]",
        invalid
          ? "border-danger focus-within:border-danger focus-within:ring-danger-500/15"
          : "border-border focus-within:border-primary-500 focus-within:ring-primary-500/20",
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          "absolute left-3 pointer-events-none select-none transition-all duration-150",
          invalid
            ? "text-danger-600"
            : focused
              ? "text-primary-600"
              : "text-fg-muted",
          lifted
            ? "top-2 text-[10px] font-medium"
            : "top-1/2 -translate-y-1/2 text-sm",
        )}
      >
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        required={required}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(
          "absolute inset-0 w-full h-full rounded-lg bg-transparent",
          "px-3 pt-5 pb-1.5 text-sm text-fg",
          "focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          suffix && "pr-10",
        )}
      />
      {suffix}
    </div>
  );
}

// ── Login form ─────────────────────────────────────────────────────
export function LoginForm() {
  const t = useTranslations("auth");
  const [state, action, isPending] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fieldError = (field: "email" | "password"): string | undefined =>
    state.error?.[field]?.[0];
  const formError: string | undefined = state.error?._form?.[0];

  return (
    <form action={action} noValidate className="space-y-4">
      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700"
        >
          <svg
            className="mt-0.5 size-4 shrink-0 text-danger-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path
              d="M12 8v4m0 4h.01"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-1">
        <FloatingField
          id="email"
          name="email"
          label={t("email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          autoFocus
          required
          invalid={!!fieldError("email")}
          describedBy={fieldError("email") ? "email-error" : undefined}
        />
        {fieldError("email") && (
          <p id="email-error" role="alert" className="text-xs text-danger-600 px-1">
            {fieldError("email")}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <FloatingField
          id="password"
          name="password"
          label={t("password")}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
          disabled={isPending}
          invalid={!!fieldError("password")}
          describedBy={fieldError("password") ? "password-error" : undefined}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hide_password") : t("show_password")}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-muted hover:text-fg transition-colors focus-ring"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          }
        />
        {fieldError("password") && (
          <p
            id="password-error"
            role="alert"
            className="text-xs text-danger-600 px-1"
          >
            {fieldError("password")}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        className="w-full"
        aria-busy={isPending}
      >
        {isPending ? t("signing_in") : t("sign_in")}
      </Button>
    </form>
  );
}
