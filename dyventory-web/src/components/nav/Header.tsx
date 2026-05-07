"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, Search, UserCog } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { useAlerts } from "@/hooks/useAlerts";
import { useSidebar } from "@/providers/SidebarProvider";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import { AlertDropdown } from "../shared/AlertDropdown";

export function Header() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useSession();
  const { toggle } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const { unreadCount } = useAlerts();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
  };

  return (
    <header className="glass-header h-14 border-b border-border bg-surface-header flex items-center gap-3 px-4 sm:px-6 shrink-0 shadow-sm">
      {/* Mobile hamburger */}
      <button
        onClick={toggle}
        className="lg:hidden p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors shrink-0"
        aria-label="Toggle navigation"
      >
        <Menu className="size-5" />
      </button>

      {/* Search bar — desktop */}
      <div className="hidden lg:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
          <input
            type="search"
            placeholder={`${t("search") ?? "Search"}…`}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-surface-muted text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-primary-400 focus:bg-surface-card focus:shadow-sm transition-all duration-150"
          />
        </div>
      </div>

      {/* Mobile: spacer */}
      <div className="flex-1 lg:hidden" />

      {/* Right controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setAlertOpen((v) => !v)}
            className="relative p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
            aria-label={t("notifications")}
            aria-expanded={alertOpen}
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger-500 ring-2 ring-surface-header" />
            )}
          </button>

          {alertOpen && <AlertDropdown onClose={() => setAlertOpen(false)} />}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-surface-muted transition-colors"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            {/* Gradient avatar */}
            <div className="size-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
              {user ? initials(user.name) : "?"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-fg leading-none">
                {user?.name}
              </p>
              <p className="text-[11px] text-fg-muted mt-0.5 capitalize">
                {user?.role}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 text-fg-muted transition-transform duration-150",
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
              <div className="absolute right-0 top-full mt-1.5 w-52 card shadow-lg z-20 py-1.5 overflow-hidden">
                <div className="px-4 py-3 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-fg truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-fg-muted truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-fg-subtle hover:text-fg hover:bg-surface-muted transition-colors"
                >
                  <UserCog className="size-4" />
                  {t("profile")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-fg-subtle hover:text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="size-4" />
                  {tAuth("logout") ?? t("sign_out")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
