"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Tag,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import type { UserRole } from "@/types";

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
  /** Roles that can see this item. Empty = all roles. */
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    key: "products",
    href: "/products",
    icon: Package,
    roles: ["admin", "manager", "vendor", "warehouse"],
  },
  {
    key: "stock",
    href: "/stock",
    icon: Warehouse,
    roles: ["admin", "manager", "vendor", "warehouse"],
  },
  { key: "sales", href: "/sales", icon: ShoppingCart },
  {
    key: "clients",
    href: "/clients",
    icon: Users,
    roles: ["admin", "manager", "vendor", "accountant"],
  },
  {
    key: "suppliers",
    href: "/suppliers",
    icon: Truck,
    roles: ["admin", "manager", "warehouse"],
  },
  { key: "reports", href: "/reports", icon: BarChart3 },
  {
    key: "promotions",
    href: "/promotions",
    icon: Tag,
    roles: ["admin", "manager"],
  },
  { key: "admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useSession();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-(--surface-sidebar) border-r border-white/5 h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2.5"
        >
          <div className="size-8 rounded-lg bg-(--color-primary-500) flex items-center justify-center">
            <Warehouse className="size-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Stoky
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin"
        aria-label="Main navigation"
      >
        {visibleItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname.startsWith(href);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-(--color-primary-500)/20 text-(--sidebar-text-active)"
                  : "text-(--sidebar-text) hover:bg-(--surface-sidebar-hover) hover:text-(--sidebar-text-active)",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings */}
      <div className="px-3 py-4 border-t border-white/5">
        <Link
          href={`/${locale}/admin/settings`}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-(--sidebar-text) hover:bg-(--surface-sidebar-hover) hover:text-(--sidebar-text-active) transition-colors"
        >
          <Settings className="size-4 shrink-0" />
          {t("settings")}
        </Link>
      </div>
    </aside>
  );
}
