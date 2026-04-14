import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { MovementHistoryTable } from "@/features/stock/components/MovementHistoryTable";
import type { StockMovement, PaginatedResponse } from "@/types";

async function getMovements(
  params: Record<string, string | undefined>,
): Promise<PaginatedResponse<StockMovement>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<StockMovement>>("/stock/movements", {
    params: filtered,
    next: { tags: ["movements"] },
  });
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    product_id?: string;
    date_from?: string;
    date_to?: string;
    per_page?: string;
  }>;
}

export default async function StockHistoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();
  const movementData = await getMovements(params);

  return (
    <div>
      <PageHeader
        title={t("stock.history.title")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("stock.title"), href: "../stock" },
          { label: t("stock.history.title") },
        ]}
      />

      <MovementHistoryTable
        movements={movementData.data}
        meta={movementData.meta}
      />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("stock.history.title") };
}
