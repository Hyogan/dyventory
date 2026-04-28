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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header section with more air */}
      <div className="pb-2">
        <PageHeader
          title={t("title")}
          description={t("description")}
          breadcrumb={[{ label: t("title") }]}
          actions={
            <Link href={`/${locale}/reports`}>
              <Button
                variant="outline"
                className="bg-surface-card shadow-sm hover:shadow-md transition-all"
                icon={<BarChart3 className="size-4" />}
              >
                {(await getTranslations("reports"))("title")}
              </Button>
            </Link>
          }
        />
      </div>

      <DashboardKpiCards stats={stats} locale={locale} />

      {/* Grid with better responsive scaling and gaps */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <DashboardRecentSales sales={stats.recent_sales} locale={locale} />
        </div>
        <div className="xl:col-span-1">
          <DashboardTopProducts products={stats.top_products} locale={locale} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}
