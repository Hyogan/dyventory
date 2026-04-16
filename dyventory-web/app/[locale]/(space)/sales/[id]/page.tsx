import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { SaleDetail } from "@/features/sales/components/SaleDetail";
import type { Sale, ApiResponse } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getSale(id: string): Promise<Sale | null> {
  try {
    const res = await authFetch<ApiResponse<Sale>>(`/sales/${id}`, {
      next: { tags: ["sales", `sale-${id}`] },
    });
    return res.data;
  } catch {
    return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  const sale = await getSale(id);
  if (!sale) notFound();

  return (
    <div>
      <PageHeader
        title={sale.sale_number}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("sales.title"), href: "../sales" },
          { label: sale.sale_number },
        ]}
      />
      <SaleDetail sale={sale} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const sale = await getSale(id);
  return { title: sale?.sale_number ?? "Sale" };
}
