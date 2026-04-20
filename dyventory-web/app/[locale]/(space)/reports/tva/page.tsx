import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReportFiltersBar } from "@/features/reports/components/ReportFiltersBar";
import { ExportButtons } from "@/features/reports/components/ExportButtons";
import {
  TvaSummaryCards,
  TvaByPeriodTable,
  TvaByRateTable,
} from "@/features/reports/components/TvaReportTables";
import type { TvaReportSummary, TvaReportPeriodRow, TvaReportRateRow } from "@/types";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; granularity?: string }>;
}

function defaultRange() {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default async function TvaReportPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { from: df, to: dt } = defaultRange();
  const from        = sp.from        ?? df;
  const to          = sp.to          ?? dt;
  const granularity = sp.granularity ?? "month";

  const params = { from, to };

  const [summary, byPeriod, byRate, t, locale] = await Promise.all([
    authFetch<TvaReportSummary>("/reports/tva/summary", { params }),
    authFetch<TvaReportPeriodRow[]>("/reports/tva/by-period", { params: { ...params, granularity } }),
    authFetch<TvaReportRateRow[]>("/reports/tva/by-rate", { params }),
    getTranslations("reports"),
    getLocale(),
  ]);
  const tn = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("tva.title")}
        description={`${from} → ${to}`}
        breadcrumb={[
          { label: tn("dashboard"), href: `/${locale}/dashboard` },
          { label: t("title"), href: `/${locale}/reports` },
          { label: t("tva.title") },
        ]}
        actions={
          <ExportButtons
            reportType="tva"
            params={{ from, to, granularity }}
            formats={["csv", "xlsx", "pdf"]}
          />
        }
      />

      <ReportFiltersBar showGranularity />

      <TvaSummaryCards summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title={t("tva.by_period")}>
          <TvaByPeriodTable rows={byPeriod} />
        </Section>
        <Section title={t("tva.by_rate")}>
          <TvaByRateTable rows={byRate} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  return { title: t("tva.title") };
}
