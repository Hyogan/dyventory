import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { FieldSchemaBuilder } from "../../../../../src/features/categories/components/FieldSchemaBuilder";
import type { Category } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCategory(id: string): Promise<Category> {
  const res = await authFetch<{ data: Category }>(`/categories/${id}`, {
    next: { tags: ["categories"] },
  });
  return res.data;
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function CategorySchemaPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  const category = await getCategory(id);

  return (
    <div>
      <PageHeader
        title={t("categories.schema.title")}
        description={t("categories.schema.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../../dashboard" },
          { label: t("categories.title"), href: "../../categories" },
          { label: category.name, href: `../` },
          { label: t("categories.schema.title") },
        ]}
      />

      <FieldSchemaBuilder
        categoryId={category.id}
        initialSchema={category.field_schema ?? []}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  try {
    const category = await getCategory(id);
    return {
      title: `${category.name} — ${t("categories.schema.title")} — Dyventory`,
    };
  } catch {
    return { title: `${t("categories.schema.title")} — Dyventory` };
  }
}
