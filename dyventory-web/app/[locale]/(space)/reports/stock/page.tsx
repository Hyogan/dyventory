import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/features/reports/components/ExportButtons";
import {
  StockValueByCategoryTable,
  StockForecastTable,
} from "@/features/reports/components/StockReportTables";
import type { StockValueCategoryRow, StockForecastRow } from "@/types";

export default async function StockReportPage() {
  const [valueByCategory, forecast, t, locale] = await Promise.all([
    authFetch<StockValueCategoryRow[]>("/reports/stock/value-by-category"),
    authFetch<StockForecastRow[]>("/reports/stock/forecast"),
    getTranslations("reports"),
    getLocale(),
  ]);
  const tn = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("stock.title")}
        description={t("stock.description")}
        breadcrumb={[
          { label: tn("dashboard"), href: `/${locale}/dashboard` },
          { label: t("title"), href: `/${locale}/reports` },
          { label: t("stock.title") },
        ]}
        actions={
          <ExportButtons
            reportType="stock-forecast"
            params={{}}
            formats={["csv", "xlsx"]}
          />
        }
      />

      <Section title={t("stock.value_by_category")}>
        <StockValueByCategoryTable rows={valueByCategory} />
      </Section>

      <Section
        title={t("stock.forecast")}
        subtitle={t("stock.forecast_sub")}
      >
        <StockForecastTable rows={forecast} />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="font-semibold text-sm text-fg">{title}</h3>
        {subtitle && <p className="text-xs text-fg-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("reports");
  return { title: t("stock.title") };
}
