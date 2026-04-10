import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoryTree } from "../../../../src/features/categories/components/CategoryTree";
import type { Category } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCategories(): Promise<Category[]> {
  const res = await authFetch<{ data: Category[] }>("/categories?tree=1", {
    next: { tags: ["categories"] },
  });
  return res.data;
}

async function getAllCategoriesFlat(): Promise<Category[]> {
  const res = await authFetch<{ data: Category[] }>("/categories", {
    next: { tags: ["categories"] },
  });
  return res.data;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoriesPage() {
  const t = await getTranslations();

  const [tree, flat] = await Promise.all([
    getCategories(),
    getAllCategoriesFlat(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("categories.title")}
        description={t("categories.schema.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("categories.title") },
        ]}
      />

      <CategoryTree categories={tree} allCategories={flat} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `${t("categories.title")} — Dyventory` };
}
