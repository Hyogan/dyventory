import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientDetail } from "@/features/clients/components/ClientDetail";
import type { Client, ClientSummary, Sale, PaginatedResponse, ApiResponse } from "@/types";

async function getClient(id: string): Promise<Client> {
  const res = await authFetch<ApiResponse<Client>>(`/clients/${id}`, {
    next: { tags: ["clients", `client-${id}`] },
  });
  return res.data;
}

async function getClientSummary(id: string): Promise<ClientSummary> {
  const res = await authFetch<ApiResponse<ClientSummary>>(`/clients/${id}/summary`, {
    next: { tags: [`client-${id}`] },
  });
  return res.data;
}

async function getClientSales(id: string): Promise<Sale[]> {
  const res = await authFetch<PaginatedResponse<Sale>>("/sales", {
    params: { client_id: id, per_page: "10" },
    next: { tags: [`client-${id}`, "sales"] },
  });
  return res.data;
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations();

  let client: Client;
  let summary: ClientSummary;
  let recentSales: Sale[];

  try {
    [client, summary, recentSales] = await Promise.all([
      getClient(id),
      getClientSummary(id),
      getClientSales(id),
    ]);
  } catch {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={client!.name}
        description={t(`clients.types.${client!.type}`)}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("clients.title"), href: `/${locale}/clients` },
          { label: client!.name },
        ]}
      />
      <ClientDetail client={client!} summary={summary!} recentSales={recentSales!} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const res = await authFetch<ApiResponse<Client>>(`/clients/${id}`, {
      next: { tags: [`client-${id}`] },
    });
    return { title: `${res.data.name} — Dyventory` };
  } catch {
    return { title: "Client — Dyventory" };
  }
}
