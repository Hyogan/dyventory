import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { SalesTable } from "@/features/sales/components/SalesTable";
import { SaleFilters } from "@/features/sales/components/SaleFilters";
import { SaleSummaryCards } from "@/features/sales/components/SaleSummaryCards";
import type { Sale, PaginatedResponse } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getSales(
  params: Record<string, string | undefined>,
): Promise<PaginatedResponse<Sale>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<Sale>>("/sales", {
    params: filtered,
    next: { tags: ["sales"] },
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    payment_status?: string;
    client_id?: string;
    date_from?: string;
    date_to?: string;
    per_page?: string;
  }>;
}

export default async function SalesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const saleData = await getSales(params);

  return (
    <div>
      <PageHeader
        title={t("sales.title")}
        description="Manage your sales transactions"
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("sales.title") },
        ]}
        actions={
          <Link href="sales/new">
            <Button icon={<Plus className="size-4" />}>
              {t("sales.create.title")}
            </Button>
          </Link>
        }
      />

      <SaleSummaryCards sales={saleData.data} total={saleData.meta.total} />

      <div className="space-y-4">
        <SaleFilters />
        <SalesTable sales={saleData.data} meta={saleData.meta} />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("sales.title") };
}
