import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProductTable } from "@/features/products/components/ProductTable";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import type { Product, Category, PaginatedResponse } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getProducts(
  params: Record<string, string | undefined>,
): Promise<PaginatedResponse<Product>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }

  return authFetch<PaginatedResponse<Product>>("/products", {
    params: filtered,
    next: { tags: ["products"] },
  });
}

async function getCategories(): Promise<Category[]> {
  const res = await authFetch<{ data: Category[] }>("/categories?tree=1", {
    next: { tags: ["categories"] },
  });
  return res.data;
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category_id?: string;
    status?: string;
    low_stock?: string;
    per_page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const [productData, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("products.title")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("products.title") },
        ]}
        actions={
          <Link href="products/new">
            <Button icon={<Plus className="size-4" />}>
              {t("products.create.title")}
            </Button>
          </Link>
        }
      />

      <div className="space-y-5">
        <ProductFilters categories={categories} />
        <ProductTable
          products={productData.data}
          meta={productData.meta}
        />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("products.title") };
}
