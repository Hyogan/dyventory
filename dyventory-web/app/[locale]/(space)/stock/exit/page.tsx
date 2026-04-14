import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { StockExitForm } from "@/features/stock/components/StockExitForm";
import type { Product, PaginatedResponse } from "@/types";

async function getProducts(): Promise<Product[]> {
  const res = await authFetch<PaginatedResponse<Product>>("/products?per_page=50&status=active", {
    next: { tags: ["products"] },
  });
  return res.data;
}

interface PageProps {
  searchParams: Promise<{ batch_id?: string }>;
}

export default async function StockExitPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();
  const products = await getProducts();

  return (
    <div>
      <PageHeader
        title={t("stock.exit.title")}
        description={t("stock.exit.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("stock.title"), href: "../stock" },
          { label: t("stock.exit.title") },
        ]}
      />

      <StockExitForm
        products={products}
        preselectedBatchId={params.batch_id ? Number(params.batch_id) : undefined}
      />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("stock.exit.title") };
}
