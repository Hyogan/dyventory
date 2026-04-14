import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductForm } from "@/features/products/components/ProductForm";
import type { Category, VatRate } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCategories(): Promise<Category[]> {
  const res = await authFetch<{ data: Category[] }>("/categories?tree=1", {
    next: { tags: ["categories"] },
  });
  return res.data;
}

async function getVatRates(): Promise<VatRate[]> {
  // VatRate endpoint might not exist yet — fallback to empty
  try {
    const res = await authFetch<{ data: VatRate[] }>("/vat-rates", {
      next: { tags: ["vat-rates"] },
    });
    return res.data;
  } catch {
    // Hardcode default if endpoint not ready
    return [{ id: 1, name: "Standard", rate: "19.25", is_default: true, is_active: true }];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NewProductPage() {
  const t = await getTranslations();

  const [categories, vatRates] = await Promise.all([
    getCategories(),
    getVatRates(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("products.create.title")}
        description={t("products.create.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("products.title"), href: ".." },
          { label: t("products.create.title") },
        ]}
      />

      <ProductForm categories={categories} vatRates={vatRates} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("products.create.title") };
}
