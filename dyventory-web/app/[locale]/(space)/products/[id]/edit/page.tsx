import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductForm } from "@/features/products/components/ProductForm";
import type { Product, Category, VatRate } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getProduct(id: string): Promise<Product> {
  const res = await authFetch<{ data: Product }>(`/products/${id}`, {
    next: { tags: ["products", `product-${id}`] },
  });
  return res.data;
}

async function getCategories(): Promise<Category[]> {
  const res = await authFetch<{ data: Category[] }>("/categories?tree=1", {
    next: { tags: ["categories"] },
  });
  return res.data;
}

async function getVatRates(): Promise<VatRate[]> {
  try {
    const res = await authFetch<{ data: VatRate[] }>("/vat-rates", {
      next: { tags: ["vat-rates"] },
    });
    return res.data;
  } catch {
    return [{ id: 1, name: "Standard", rate: "19.25", is_default: true, is_active: true }];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  const [product, categories, vatRates] = await Promise.all([
    getProduct(id),
    getCategories(),
    getVatRates(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("products.edit.title")}
        description={t("products.edit.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../../dashboard" },
          { label: t("products.title"), href: "../.." },
          { label: product.name, href: ".." },
          { label: t("common.edit") },
        ]}
      />

      <ProductForm
        product={product}
        categories={categories}
        vatRates={vatRates}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  try {
    const product = await getProduct(id);
    return {
      title: `${t("common.edit")} — ${product.name} — Dyventory`,
    };
  } catch {
    return { title: `${t("products.edit.title")} — Dyventory` };
  }
}
