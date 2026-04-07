"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { AUTH_COOKIE } from "@/lib/auth";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";

export function Header() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    // Clear the auth cookie via a server action or API call
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
  };

  return (
    <header className="h-14 border-b border-(--border-default) bg-(--surface-header) flex items-center justify-between px-6 shrink-0">
      {/* Left — empty or breadcrumb slot */}
      <div />

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notification bell — wired up in Phase 4 */}
        <button
          className="relative p-2 rounded-md text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-muted) transition-colors"
          aria-label={t("notifications")}
        >
          <Bell className="size-4.5" />
          {/* Unread badge — populated in Phase 4 */}
          {/* <span className="absolute top-1 right-1 size-2 rounded-full bg-(--color-danger-500)" /> */}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-(--surface-muted) transition-colors"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            {/* Avatar */}
            <div className="size-7 rounded-full bg-(--color-primary-100) text-(--color-primary-700) flex items-center justify-center text-xs font-bold shrink-0">
              {user ? initials(user.name) : "?"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-(--text-primary) leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-(--text-muted) mt-0.5 capitalize">
                {user?.role}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 text-(--text-muted) transition-transform",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-full mt-1 w-48 card shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-(--border-default) mb-1">
                  <p className="text-sm font-medium text-(--text-primary) truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-(--text-muted) truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-muted) transition-colors"
                >
                  <LogOut className="size-4" />
                  {tAuth("logout") ?? t("logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
