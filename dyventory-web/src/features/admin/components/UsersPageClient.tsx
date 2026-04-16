"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/shared/SearchInput";
import { UsersTable } from "./UsersTable";
import { UserModal } from "./UserModal";
import type { User, PaginatedResponse } from "@/types";

const ROLES = ["admin", "manager", "vendor", "warehouse", "accountant"] as const;

interface UsersPageClientProps {
  userData: PaginatedResponse<User>;
}

export function UsersPageClient({ userData }: UsersPageClientProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const push = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <SearchInput
            value={searchParams.get("search") ?? ""}
            onChange={(v) => push("search", v)}
            placeholder={tc("search")}
          />
          <select
            value={searchParams.get("role") ?? ""}
            onChange={(e) => push("role", e.target.value)}
            className="input-select h-9 text-sm w-[160px]"
            aria-label={t("fields.role")}
          >
            <option value="">{t("all_roles")}</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
          {t("create")}
        </Button>
      </div>

      <UsersTable
        users={userData.data}
        meta={userData.meta}
        onEdit={(user) => setEditUser(user)}
      />

      <UserModal
        open={createOpen || !!editUser}
        onClose={() => { setCreateOpen(false); setEditUser(null); }}
        user={editUser}
      />
    </>
  );
}
