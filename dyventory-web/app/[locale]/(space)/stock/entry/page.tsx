import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { StockEntryForm } from "@/features/stock/components/StockEntryForm";
import type { Product, PaginatedResponse } from "@/types";

async function getProducts(): Promise<Product[]> {
  const res = await authFetch<PaginatedResponse<Product>>("/products?per_page=50&status=active", {
    next: { tags: ["products"] },
  });
  return res.data;
}

interface PageProps {
  searchParams: Promise<{ product_id?: string }>;
}

export default async function StockEntryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();
  const products = await getProducts();

  return (
    <div>
      <PageHeader
        title={t("stock.entry.title")}
        description={t("stock.entry.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("stock.title"), href: "../stock" },
          { label: t("stock.entry.title") },
        ]}
      />

      <StockEntryForm
        products={products}
        preselectedProductId={params.product_id ? Number(params.product_id) : undefined}
      />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("stock.entry.title") };
}
