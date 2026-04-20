import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { TrendingUp, Package, Receipt, CreditCard, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function ReportsPage() {
  const [t, locale] = await Promise.all([
    getTranslations("reports"),
    getLocale(),
  ]);
  const tn = await getTranslations("nav");

  const sections = [
    {
      key: "sales",
      href: `/${locale}/reports/sales`,
      icon: TrendingUp,
      title: t("sales.title"),
      description: t("sales.description"),
      color: "text-primary-600",
      bg: "bg-primary-50 border-primary-100 hover:border-primary-300",
    },
    {
      key: "tva",
      href: `/${locale}/reports/tva`,
      icon: Receipt,
      title: t("tva.title"),
      description: t("tva.description"),
      color: "text-violet-600",
      bg: "bg-violet-50 border-violet-100 hover:border-violet-300",
    },
    {
      key: "credits",
      href: `/${locale}/reports/credits`,
      icon: CreditCard,
      title: t("credits.title"),
      description: t("credits.description"),
      color: "text-danger-600",
      bg: "bg-danger-50 border-danger-100 hover:border-danger-300",
    },
    {
      key: "stock",
      href: `/${locale}/reports/stock`,
      icon: Package,
      title: t("stock.title"),
      description: t("stock.description"),
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100 hover:border-amber-300",
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumb={[
          { label: tn("dashboard"), href: `/${locale}/dashboard` },
          { label: t("title") },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.key}
              href={s.href}
              className={`rounded-xl border p-6 flex items-start gap-4 transition-all ${s.bg}`}
            >
              <div className={`mt-0.5 ${s.color}`}>
                <Icon className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-fg">{s.title}</h3>
                <p className="text-sm text-fg-muted mt-0.5">{s.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("reports");
  return { title: t("title") };
}
