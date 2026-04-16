import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewSaleForm } from "@/features/sales/components/NewSaleForm";

export default async function NewSalePage() {
  const t = await getTranslations();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t("sales.create.title")}
        description={t("sales.create.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("sales.title"), href: "../sales" },
          { label: t("sales.create.title") },
        ]}
      />
      <NewSaleForm />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("sales.create.title") };
}
