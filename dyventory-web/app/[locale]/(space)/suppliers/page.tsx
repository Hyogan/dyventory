import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { SuppliersPageClient } from "@/features/suppliers/components/SuppliersPageClient";
import type { Supplier, PaginatedResponse } from "@/types";

async function getSuppliers(params: Record<string, string | undefined>): Promise<PaginatedResponse<Supplier>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<Supplier>>("/suppliers", {
    params: filtered,
    next: { tags: ["suppliers"] },
  });
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    is_active?: string;
    per_page?: string;
  }>;
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const supplierData = await getSuppliers(params);

  return (
    <div>
      <PageHeader
        title={t("suppliers.title")}
        description={t("suppliers.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("suppliers.title") },
        ]}
      />
      <SuppliersPageClient supplierData={supplierData} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `${t("suppliers.title")} — Dyventory` };
}
