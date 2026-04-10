"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { useSidebar } from "@/providers/SidebarProvider";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";

export function Header() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useSession();
  const { toggle } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
  };

  return (
    <header className="h-14 border-b border-border bg-surface-header flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left — hamburger on mobile */}
      <button
        onClick={toggle}
        className="lg:hidden p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
        aria-label="Toggle navigation"
      >
        <Menu className="size-5" />
      </button>

      {/* Desktop left slot — empty */}
      <div className="hidden lg:block" />

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notification bell — wired up in Phase 4 */}
        <button
          className="relative p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
          aria-label={t("notifications")}
        >
          <Bell className="size-4.5" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-surface-muted transition-colors"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            {/* Avatar */}
            <div className="size-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
              {user ? initials(user.name) : "?"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-fg leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-fg-muted mt-0.5 capitalize">
                {user?.role}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 text-fg-muted transition-transform",
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
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-fg truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-fg-muted truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fg-subtle hover:text-fg hover:bg-surface-muted transition-colors"
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
