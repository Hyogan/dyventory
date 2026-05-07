import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { SupplierOrdersPageClient } from "@/features/suppliers/components/SupplierOrdersPageClient";
import type { SupplierOrder, Supplier, PaginatedResponse } from "@/types";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    supplier_id?: string;
    page?: string;
    per_page?: string;
  }>;
}

async function getOrders(
  params: Record<string, string | undefined>,
): Promise<PaginatedResponse<SupplierOrder>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<SupplierOrder>>("/supplier-orders", {
    params: filtered,
    next: { tags: ["orders"] },
  });
}

async function getSuppliers(): Promise<Supplier[]> {
  const res = await authFetch<PaginatedResponse<Supplier>>("/suppliers", {
    params: { per_page: "200" },
    next: { tags: ["suppliers"] },
  });
  return res.data;
}

export default async function SupplierOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const [ordersData, suppliers] = await Promise.all([
    getOrders(params),
    getSuppliers(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("suppliers.orders.title")}
        description={t("suppliers.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("nav.suppliers"), href: "../suppliers" },
          { label: t("suppliers.orders.title") },
        ]}
      />
      <SupplierOrdersPageClient
        orders={ordersData.data}
        meta={ordersData.meta}
        suppliers={suppliers}
      />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `${t("suppliers.orders.title")} — Dyventory` };
}
