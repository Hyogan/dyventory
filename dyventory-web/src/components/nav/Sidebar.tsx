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
  Layers,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { useSidebar } from "@/providers/SidebarProvider";
import type { UserRole } from "@/types";

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
  group: "main" | "inventory" | "admin";
}

const navItems: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "main",
  },
  { key: "sales", href: "/sales", icon: ShoppingCart, group: "main" },
  { key: "reports", href: "/reports", icon: BarChart3, group: "main" },
  {
    key: "products",
    href: "/products",
    icon: Package,
    roles: ["admin", "manager", "vendor", "warehouse"],
    group: "inventory",
  },
  {
    key: "stock",
    href: "/stock",
    icon: Warehouse,
    roles: ["admin", "manager", "vendor", "warehouse"],
    group: "inventory",
  },
  {
    key: "categories",
    href: "/categories",
    icon: Layers,
    roles: ["admin", "manager", "vendor", "warehouse"],
    group: "inventory",
  },
  {
    key: "clients",
    href: "/clients",
    icon: Users,
    roles: ["admin", "manager", "vendor", "accountant"],
    group: "inventory",
  },
  {
    key: "suppliers",
    href: "/suppliers",
    icon: Truck,
    roles: ["admin", "manager", "warehouse"],
    group: "inventory",
  },
  {
    key: "promotions",
    href: "/promotions",
    icon: Tag,
    roles: ["admin", "manager"],
    group: "inventory",
  },
  {
    key: "admin",
    href: "/admin",
    icon: ShieldCheck,
    roles: ["admin"],
    group: "admin",
  },
];

function NavGroup({
  label,
  items,
  renderLink,
}: {
  label: string;
  items: NavItem[];
  renderLink: (item: NavItem) => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-fg-muted mb-1">
        {label}
      </p>
      {items.map(renderLink)}
    </div>
  );
}

export function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useSession();
  const { isOpen, close } = useSidebar();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  const renderNavLink = (item: NavItem) => {
    const href = `/${locale}${item.href}`;
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={item.key}
        href={href}
        onClick={close}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-sidebar-active text-sidebar-fg-active"
            : "text-sidebar-fg hover:text-fg hover:bg-sidebar-hover",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Active left accent bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full" />
        )}

        <Icon
          className={cn(
            "size-4.5 shrink-0 transition-colors duration-150",
            isActive
              ? "text-primary-600"
              : "text-fg-muted group-hover:text-fg-subtle",
          )}
        />

        <span className="flex-1 truncate">{t(item.key)}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64",
          "flex flex-col bg-surface-sidebar border-r border-border sidebar-shadow",
          "transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0 lg:shrink-0",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 group"
            onClick={close}
          >
            <div className="size-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-sm group-hover:rotate-3 transition-transform duration-200">
              <Warehouse className="size-5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-fg tracking-tight">
              Dyventory
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-thin"
          aria-label="Main navigation"
        >
          <NavGroup
            label="General"
            items={visibleItems.filter((i) => i.group === "main")}
            renderLink={renderNavLink}
          />
          <NavGroup
            label="Management"
            items={visibleItems.filter((i) => i.group === "inventory")}
            renderLink={renderNavLink}
          />
          <NavGroup
            label="Admin"
            items={visibleItems.filter((i) => i.group === "admin")}
            renderLink={renderNavLink}
          />
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border shrink-0">
          <Link
            href={`/${locale}/admin/settings`}
            onClick={close}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              pathname.startsWith(`/${locale}/admin/settings`)
                ? "bg-sidebar-active text-sidebar-fg-active"
                : "text-sidebar-fg hover:text-fg hover:bg-sidebar-hover",
            )}
          >
            <Settings className="size-4.5 shrink-0 text-fg-muted" />
            <span>{t("settings")}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
