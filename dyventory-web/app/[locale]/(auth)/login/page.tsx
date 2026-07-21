import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/pages/LoginForm";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("sign_in")} — Dyventory` };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations("auth");
  void searchParams;

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel (desktop only) ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 bg-primary relative overflow-hidden"
        aria-hidden="true"
      >
        {/* Grid texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(oklch(1 0 0 / 0.07) 0 1px, transparent 1px 48px),
              repeating-linear-gradient(90deg, oklch(1 0 0 / 0.07) 0 1px, transparent 1px 48px)
            `,
          }}
        />

        {/* Content sits above the texture */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <svg
                className="size-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Dyventory
            </span>
          </div>

          {/* Tagline block */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-white/50 uppercase tracking-widest">
              {t("login_subtitle")}
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight text-balance">
              {t("login_tagline")}
            </h1>
          </div>

          {/* Footer note */}
          <p className="text-xs text-white/40">
            {t("login_footer")}
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-surface-bg">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand mark */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary">
              <svg
                className="size-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-fg">
              Dyventory
            </p>
            <p className="mt-1 text-sm text-fg-muted">{t("login_subtitle")}</p>
          </div>

          {/* Card */}
          <div className="card p-6">
            <h2 className="mb-1 text-base font-semibold text-fg">
              {t("sign_in")}
            </h2>
            <p className="mb-5 text-sm text-fg-muted">{t("login_subtitle")}</p>
            <LoginForm />
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-fg-muted">
            {t("login_footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
