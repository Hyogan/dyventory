import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { SupplierDetail } from "@/features/suppliers/components/SupplierDetail";
import type {
  Supplier,
  SupplierSummary,
  SupplierOrder,
  Product,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

async function getSupplier(id: string): Promise<Supplier> {
  const res = await authFetch<ApiResponse<Supplier>>(`/suppliers/${id}`, {
    next: { tags: ["suppliers", `supplier-${id}`] },
  });
  return res.data;
}

async function getSupplierSummary(id: string): Promise<SupplierSummary> {
  const res = await authFetch<ApiResponse<SupplierSummary>>(`/suppliers/${id}/summary`, {
    next: { tags: [`supplier-${id}`] },
  });
  return res.data;
}

async function getSupplierOrders(id: string): Promise<SupplierOrder[]> {
  const res = await authFetch<PaginatedResponse<SupplierOrder>>(
    `/suppliers/${id}/orders`,
    { next: { tags: [`supplier-${id}`, "orders"] } },
  );
  return res.data;
}

async function getProducts(): Promise<Product[]> {
  const res = await authFetch<PaginatedResponse<Product>>("/products", {
    params: { status: "active", per_page: "500" },
    next: { tags: ["products"] },
  });
  return res.data;
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations();

  let supplier: Supplier;
  let summary: SupplierSummary;
  let orders: SupplierOrder[];
  let products: Product[];

  try {
    [supplier, summary, orders, products] = await Promise.all([
      getSupplier(id),
      getSupplierSummary(id),
      getSupplierOrders(id),
      getProducts(),
    ]);
  } catch {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={supplier!.name}
        description={t("suppliers.title")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("suppliers.title"), href: `/${locale}/suppliers` },
          { label: supplier!.name },
        ]}
      />
      <SupplierDetail
        supplier={supplier!}
        summary={summary!}
        orders={orders!}
        products={products!}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const res = await authFetch<ApiResponse<Supplier>>(`/suppliers/${id}`, {
      next: { tags: [`supplier-${id}`] },
    });
    return { title: `${res.data.name} — Dyventory` };
  } catch {
    return { title: "Supplier — Dyventory" };
  }
}
