import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { getPromotions } from "@/features/promotions/actions";
import { PromotionsPageClient } from "@/features/promotions/components/PromotionsPageClient";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
    is_active?: string;
    per_page?: string;
  }>;
}

export default async function PromotionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }

  const { data: promotions, meta } = await getPromotions(filtered);

  return (
    <div>
      <PageHeader
        title={t("promotions.title")}
        description={t("promotions.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("promotions.title") },
        ]}
      />

      <PromotionsPageClient promotions={promotions} meta={meta} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("promotions.title") };
}
