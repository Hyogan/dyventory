import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientsPageClient } from "@/features/clients/components/ClientsPageClient";
import type { Client, PaginatedResponse } from "@/types";

async function getClients(params: Record<string, string | undefined>): Promise<PaginatedResponse<Client>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<Client>>("/clients", {
    params: filtered,
    next: { tags: ["clients"] },
  });
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
    is_active?: string;
    per_page?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const clientData = await getClients(params);

  return (
    <div>
      <PageHeader
        title={t("clients.title")}
        description={t("clients.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("clients.title") },
        ]}
      />
      <ClientsPageClient clientData={clientData} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `${t("clients.title")} — Dyventory` };
}
