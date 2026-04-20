import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReportFiltersBar } from "@/features/reports/components/ReportFiltersBar";
import {
  CreditSummaryCards,
  OutstandingByClientTable,
  OverdueInvoicesTable,
} from "@/features/reports/components/CreditReportTables";
import type { CreditReportSummary, CreditReportClientRow, OverdueInvoice } from "@/types";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

function defaultRange() {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default async function CreditReportPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { from: df, to: dt } = defaultRange();
  const from = sp.from ?? df;
  const to   = sp.to   ?? dt;

  const params = { from, to };

  const [summary, byClient, overdue, t, locale] = await Promise.all([
    authFetch<CreditReportSummary>("/reports/credit/summary", { params }),
    authFetch<CreditReportClientRow[]>("/reports/credit/by-client", { params }),
    authFetch<OverdueInvoice[]>("/reports/credit/overdue"),
    getTranslations("reports"),
    getLocale(),
  ]);
  const tn = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("credits.title")}
        description={`${from} → ${to}`}
        breadcrumb={[
          { label: tn("dashboard"), href: `/${locale}/dashboard` },
          { label: t("title"), href: `/${locale}/reports` },
          { label: t("credits.title") },
        ]}
      />

      <ReportFiltersBar showGranularity={false} />

      <CreditSummaryCards summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title={t("credits.by_client")}>
          <OutstandingByClientTable rows={byClient} />
        </Section>
        <Section title={t("credits.overdue")}>
          <OverdueInvoicesTable rows={overdue} />
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
  return { title: t("credits.title") };
}
