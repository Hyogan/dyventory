import { getTranslations } from "next-intl/server";
import { Plus, ArrowUpRight, History, ClipboardList } from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { StockTable, StockAlertBar } from "@/features/stock/components/StockTable";
import { StockFilters } from "@/features/stock/components/StockFilters";
import type { Batch, Category, PaginatedResponse } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getBatches(
  params: Record<string, string | undefined>,
): Promise<PaginatedResponse<Batch>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<Batch>>("/batches", {
    params: filtered,
    next: { tags: ["batches"] },
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
    expiry_warning?: string;
    per_page?: string;
  }>;
}

export default async function StockPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const [batchData, categories] = await Promise.all([
    getBatches(params),
    getCategories(),
  ]);

  // Count alert badges from current page
  const lowStockCount = batchData.data.filter(
    (b) => Number(b.current_quantity) > 0 && Number(b.current_quantity) <= 5,
  ).length;
  const expiringCount = batchData.data.filter(
    (b) => !b.is_expired && b.days_until_expiry !== null && b.days_until_expiry! <= 30,
  ).length;

  return (
    <div>
      <PageHeader
        title={t("stock.title")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("stock.title") },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="stock/history">
              <Button variant="ghost" size="sm" icon={<History className="size-4" />}>
                {t("stock.history.title")}
              </Button>
            </Link>
            <Link href="stock/inventory">
              <Button variant="outline" size="sm" icon={<ClipboardList className="size-4" />}>
                {t("stock.inventory.title")}
              </Button>
            </Link>
            <Link href="stock/exit">
              <Button variant="outline" size="sm" icon={<ArrowUpRight className="size-4" />}>
                {t("stock.exit.title")}
              </Button>
            </Link>
            <Link href="stock/entry">
              <Button icon={<Plus className="size-4" />}>
                {t("stock.entry.title")}
              </Button>
            </Link>
          </div>
        }
      />

      <StockAlertBar lowStockCount={lowStockCount} expiringCount={expiringCount} />

      <div className="space-y-5">
        <StockFilters categories={categories} />
        <StockTable batches={batchData.data} meta={batchData.meta} />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("stock.title") };
}
