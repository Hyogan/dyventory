import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import type { User } from "@/types";

export default async function ProfilePage() {
  const t = await getTranslations("admin.profile");
  const tn = await getTranslations("nav");
  const authUser = await getCurrentUser();

  // Cast AuthUser to User (same shape, AuthUser is a subset)
  const user = authUser as unknown as User;

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumb={[
          { label: tn("dashboard"), href: "../dashboard" },
          { label: t("title") },
        ]}
      />
      <ProfileForm user={user} />
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations("admin.profile");
  return { title: `${t("title")} — Dyventory` };
}
