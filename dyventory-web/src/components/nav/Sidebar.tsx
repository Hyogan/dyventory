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
  ChevronRight,
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
  group?: "main" | "inventory" | "admin";
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

export function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useSession();
  const { isOpen, close } = useSidebar();

  const visibleItems = navItems.filter((item) => {
    return !item.roles || (user && item.roles.includes(user.role));
  });

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
          "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-white/10 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Active Indicator Pill */}
        {isActive && (
          <div className="absolute left-0 w-1 h-5 bg-primary-500 rounded-r-full" />
        )}

        <Icon
          className={cn(
            "size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
            isActive ? "text-primary-400" : "group-hover:text-white",
          )}
        />

        <span className="flex-1">{t(item.key)}</span>

        {isActive && <ChevronRight className="size-3 opacity-50" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay with backdrop blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64",
          "flex flex-col bg-[#09090b] border-r border-white/10", // Deep dark background
          "transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0 lg:shrink-0",
        )}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 group"
            onClick={close}
          >
            <div className="size-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:rotate-3 transition-transform">
              <Warehouse className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight italic">
              Dyventory
            </span>
          </Link>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
          {/* Main Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              General
            </p>
            {visibleItems.filter((i) => i.group === "main").map(renderNavLink)}
          </div>

          {/* Inventory Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Management
            </p>
            {visibleItems
              .filter((i) => i.group === "inventory")
              .map(renderNavLink)}
          </div>
        </nav>

        {/* Footer: User & Settings */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <Link
            href={`/${locale}/admin/settings`}
            onClick={close}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings className="size-4.5 shrink-0" />
            <span>{t("settings")}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
