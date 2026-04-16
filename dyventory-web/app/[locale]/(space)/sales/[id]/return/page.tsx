import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReturnForm } from "@/features/sales/components/ReturnForm";
import type { Sale, ApiResponse } from "@/types";

async function getSale(id: string): Promise<Sale | null> {
  try {
    const res = await authFetch<ApiResponse<Sale>>(`/sales/${id}`, {
      next: { tags: [`sale-${id}`] },
    });
    return res.data;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ReturnPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  const sale = await getSale(id);
  if (!sale) notFound();

  // Validate the sale can be returned
  if (sale.status === "cancelled" || sale.status === "draft") {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={t("sales.return.title")}
        description={t("sales.return.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../../dashboard" },
          { label: t("sales.title"), href: "../../sales" },
          { label: sale.sale_number, href: `../../sales/${id}` },
          { label: t("sales.return.title") },
        ]}
      />
      <ReturnForm sale={sale} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();
  return { title: t("sales.return.title") };
}
