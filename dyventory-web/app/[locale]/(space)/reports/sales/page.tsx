import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReportFiltersBar } from "@/features/reports/components/ReportFiltersBar";
import { ExportButtons } from "@/features/reports/components/ExportButtons";
import {
  SalesSummaryCards,
  SalesByPeriodTable,
  SalesByVendorTable,
  SalesByCategoryTable,
  SalesByClientTable,
} from "@/features/reports/components/SalesReportTables";
import type {
  SalesReportSummary,
  SalesReportPeriodRow,
  SalesReportVendorRow,
  SalesReportCategoryRow,
  SalesReportClientRow,
} from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    granularity?: string;
  }>;
}

function defaultRange() {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SalesReportPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { from: df, to: dt } = defaultRange();
  const from        = sp.from        ?? df;
  const to          = sp.to          ?? dt;
  const granularity = sp.granularity ?? "month";

  const params = { from, to };

  const [summary, byPeriod, byVendor, byCategory, byClient, t, locale] = await Promise.all([
    authFetch<SalesReportSummary>("/reports/sales/summary", { params }),
    authFetch<SalesReportPeriodRow[]>("/reports/sales/by-period", { params: { ...params, granularity } }),
    authFetch<SalesReportVendorRow[]>("/reports/sales/by-vendor", { params }),
    authFetch<SalesReportCategoryRow[]>("/reports/sales/by-category", { params }),
    authFetch<SalesReportClientRow[]>("/reports/sales/by-client", { params }),
    getTranslations("reports"),
    getLocale(),
  ]);
  const tn = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.title")}
        description={`${from} → ${to}`}
        breadcrumb={[
          { label: tn("dashboard"), href: `/${locale}/dashboard` },
          { label: t("title"), href: `/${locale}/reports` },
          { label: t("sales.title") },
        ]}
        actions={
          <ExportButtons
            reportType="sales"
            params={{ from, to, granularity }}
            formats={["csv", "xlsx", "pdf"]}
          />
        }
      />

      <ReportFiltersBar showGranularity />

      <SalesSummaryCards summary={summary} />

      <ReportSection title={t("sales.by_period")}>
        <SalesByPeriodTable rows={byPeriod} />
      </ReportSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection title={t("sales.by_vendor")}>
          <SalesByVendorTable rows={byVendor} />
        </ReportSection>
        <ReportSection title={t("sales.by_category")}>
          <SalesByCategoryTable rows={byCategory} />
        </ReportSection>
      </div>

      <ReportSection title={t("sales.by_client")}>
        <SalesByClientTable rows={byClient} />
      </ReportSection>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="font-semibold text-sm text-fg">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("reports");
  return { title: t("sales.title") };
}
