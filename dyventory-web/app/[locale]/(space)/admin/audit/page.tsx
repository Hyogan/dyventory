import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { AuditTable } from "@/features/admin/components/AuditTable";
import { AuditFilters } from "@/features/admin/components/AuditFilters";
import type { AuditLog, PaginatedResponse } from "@/types";

async function getAuditLogs(params: Record<string, string | undefined>): Promise<PaginatedResponse<AuditLog>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<AuditLog>>("/audit-logs", {
    params: filtered,
    cache: "no-store",
  });
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    entity_type?: string;
    http_method?: string;
    date_from?: string;
    date_to?: string;
    per_page?: string;
  }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const logData = await getAuditLogs(params);

  return (
    <div>
      <PageHeader
        title={t("admin.audit.title")}
        description={t("admin.audit.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("nav.admin"), href: "../admin" },
          { label: t("admin.audit.title") },
        ]}
      />
      <div className="space-y-4">
        <AuditFilters />
        <AuditTable logs={logData.data} meta={logData.meta} />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `${t("admin.audit.title")} — Dyventory` };
}
