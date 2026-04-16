import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import type { Setting, VatRate, ApiResponse } from "@/types";

async function getSettings(): Promise<Record<string, Setting[]>> {
  const res = await authFetch<ApiResponse<Record<string, Setting[]>>>("/settings", {
    next: { tags: ["settings"] },
  });
  return res.data;
}

async function getVatRates(): Promise<VatRate[]> {
  const res = await authFetch<ApiResponse<VatRate[]>>("/vat-rates", {
    next: { tags: ["vat-rates"] },
  });
  return res.data;
}

export default async function SettingsPage() {
  const t = await getTranslations();

  const [settingsByGroup, vatRates] = await Promise.all([
    getSettings(),
    getVatRates(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("admin.settings.title")}
        description={t("admin.settings.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("nav.admin"), href: "../admin" },
          { label: t("admin.settings.title") },
        ]}
      />
      <SettingsForm settingsByGroup={settingsByGroup} vatRates={vatRates} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `${t("admin.settings.title")} — Dyventory` };
}
