import { getTranslations } from "next-intl/server";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { UsersPageClient } from "@/features/admin/components/UsersPageClient";
import type { User, PaginatedResponse } from "@/types";

async function getUsers(params: Record<string, string | undefined>): Promise<PaginatedResponse<User>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v) filtered[k] = v;
  }
  return authFetch<PaginatedResponse<User>>("/users", {
    params: filtered,
    next: { tags: ["users"] },
  });
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    per_page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations();

  const userData = await getUsers(params);

  return (
    <div>
      <PageHeader
        title={t("admin.users.title")}
        description={t("admin.users.description")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("nav.admin"), href: "../admin" },
          { label: t("admin.users.title") },
        ]}
      />
      <UsersPageClient userData={userData} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `${t("admin.users.title")} — Dyventory` };
}
