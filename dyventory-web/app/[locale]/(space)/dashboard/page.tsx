import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { DashboardKpiCards } from "@/features/dashboard/components/DashboardKpiCards";
import { DashboardTopProducts } from "@/features/dashboard/components/DashboardTopProducts";
import { DashboardRecentSales } from "@/features/dashboard/components/DashboardRecentSales";
import type { DashboardStats } from "@/types";

async function getDashboardStats(): Promise<DashboardStats> {
  return authFetch<DashboardStats>("/dashboard", {
    next: { revalidate: 300, tags: ["dashboard"] },
  });
}

export default async function DashboardPage() {
  const [stats, t, locale] = await Promise.all([
    getDashboardStats(),
    getTranslations("dashboard"),
    getLocale(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumb={[{ label: t("title") }]}
        actions={
          <Link href={`/${locale}/reports`}>
            <Button variant="outline" icon={<BarChart3 className="size-4" />}>
              {(await getTranslations("reports"))("title")}
            </Button>
          </Link>
        }
      />

      <DashboardKpiCards stats={stats} locale={locale} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardTopProducts products={stats.top_products} locale={locale} />
        <DashboardRecentSales sales={stats.recent_sales} locale={locale} />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}
