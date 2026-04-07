"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { LoginFormState } from "@/types/auth";
import { cn } from "@/lib/utils";
import { loginAction } from "../actions/login";

const initialState: LoginFormState = { error: null };

export function LoginForm() {
  const t = useTranslations("auth");
  const [state, action, isPending] = useActionState(loginAction, initialState);

  const fieldError = (field: "email" | "password"): string | undefined =>
    state.error?.[field]?.[0];

  const formError: string | undefined = state.error?._form?.[0];

  return (
    <form action={action} noValidate className="space-y-5">
      {/* Global form error */}
      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-(--text-primary)"
        >
          {t("email")}
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          aria-invalid={!!fieldError("email")}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          className={cn(
            "input",
            fieldError("email") &&
              "border-red-400 focus:border-red-400 focus:ring-red-200",
          )}
          placeholder="you@example.com"
        />
        {fieldError("email") && (
          <p id="email-error" role="alert" className="text-xs text-red-600">
            {fieldError("email")}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-(--text-primary)"
        >
          {t("password")}
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          aria-invalid={!!fieldError("password")}
          aria-describedby={
            fieldError("password") ? "password-error" : undefined
          }
          className={cn(
            "input",
            fieldError("password") &&
              "border-red-400 focus:border-red-400 focus:ring-red-200",
          )}
          placeholder="••••••••"
        />
        {fieldError("password") && (
          <p id="password-error" role="alert" className="text-xs text-red-600">
            {fieldError("password")}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full h-10 px-4 rounded font-medium text-sm text-white",
          "bg-(--color-primary) hover:opacity-90 active:scale-[0.99]",
          "transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "inline-flex items-center justify-center gap-2",
        )}
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin size-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {t("signing_in")}
          </>
        ) : (
          t("sign_in")
        )}
      </button>
    </form>
  );
}
