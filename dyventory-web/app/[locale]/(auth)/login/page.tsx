import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/pages/LoginForm";

// interface LoginPageProps {
//   params: Promise<{ locale: string }>;
//   searchParams: Promise<{ callbackUrl?: string }>;
// }
interface LoginPageProps {
  params: { locale: string };
  searchParams: { callbackUrl?: string };
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
  // callbackUrl is available if proxy.ts redirected here from a protected route.
  // The loginAction Server Action handles the redirect — no client-side handling needed.
  void searchParams; // consumed by the action via the form's hidden field if needed

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--surface-bg) px-4">
      <div className="w-full max-w-sm">
        {/* ── Brand mark ─────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl"
            style={{ background: "oklch(0.55 0.2 250)" }}
            aria-hidden="true"
          >
            {/* Cube / box icon — represents stock management */}
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
          <h1 className="text-2xl font-semibold tracking-tight text-(--text-primary)">
            Stoky
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            {t("login_subtitle")}
          </p>
        </div>

        {/* ── Card ───────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="mb-5 text-base font-semibold text-primary">
            {t("sign_in")}
          </h2>
          <LoginForm />
        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-(--text-muted)">
          {t("login_footer")}
        </p>
      </div>
    </div>
  );
}
