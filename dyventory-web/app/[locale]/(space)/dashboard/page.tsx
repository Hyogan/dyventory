"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  Bell,
  Scale,
  Calendar,
  MoreVertical,
  ChevronRight,
  FileText,
  Settings,
  Globe,
} from "lucide-react";

// Assuming these are your custom UI components
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function StockSalesDashboard() {
  const [locale, setLocale] = useState("EN");

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* --- Sidebar (Modern & Compact) --- */}
      {/* <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <Package className="size-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">StockMaster</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Package} label="Inventory" />
          <NavItem icon={ShoppingCart} label="Sales" />
          <NavItem icon={Users} label="Clients & Suppliers" />
          <NavItem icon={FileText} label="Reports" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Role
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white text-primary border-primary/20"
              >
                Administrator
              </Badge>
            </div>
          </div>
        </div>
      </aside> */}

      <div className="flex-1 flex flex-col min-w-0">
        {/* --- Top Header --- */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              placeholder="Search products, SKUs, or invoices (Cmd + K)"
              className="w-full pl-11 pr-4 h-11 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === "EN" ? "FR" : "EN")}
              className="gap-2 font-medium"
            >
              <Globe className="size-4" /> {locale}
            </Button>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">
                  Steve Tchingang
                </p>
                <p className="text-xs text-slate-500">steve@company.cm</p>
              </div>
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                ST
              </div>
            </div>
          </div>
        </header>

        {/* --- Main Content --- */}
        <main className="p-8 space-y-8 animate-in fade-in duration-500">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Business Overview
              </h1>
              <p className="text-slate-500 mt-1">Status as of March 0, 2026</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-slate-200">
                Export Report
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="size-4 mr-2" /> New Sale
              </Button>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Daily Revenue"
              value="1,240,500 XAF"
              trend="+12.5%"
              trendUp={true}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              label="Stock Value"
              value="42,850,000 XAF"
              trend="2,400 items"
              icon={Package}
              color="purple"
            />
            <StatCard
              label="Critical Alerts"
              value="14 Items"
              subValue="Expiry / Low Stock"
              icon={AlertTriangle}
              color="red"
            />
            <StatCard
              label="Snail Stock"
              value="842.5 kg"
              trend="-2.4% mortality"
              trendUp={false}
              icon={Scale}
              color="emerald"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Table: Critical Stock Items */}
            <Card className="lg:col-span-2 overflow-hidden border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Inventory Alerts (FEFO Priority)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs"
                >
                  View Catalogue
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Product / Category</th>
                      <th className="px-6 py-4">Current Stock</th>
                      <th className="px-6 py-4">Batch Expiry</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <TableRow
                      name="Fresh Snails (Gros Gris)"
                      category="Living Products"
                      stock="12.4 kg"
                      expiry="Apr 02, 2026"
                      status="critical"
                    />
                    <TableRow
                      name="Organic Tomato Paste"
                      category="Perishable Food"
                      stock="42 Units"
                      expiry="In 3 days"
                      status="warning"
                    />
                    <TableRow
                      name="Blue Cotton T-Shirt (M)"
                      category="Clothing"
                      stock="0 Units"
                      expiry="N/A"
                      status="out"
                    />
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Sidebar Column: Recent Activity / Sales */}
            <div className="space-y-6">
              <Card className="p-6 border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Recent Sales</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ShoppingCart className="size-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">
                          Sale #INV-2026-{1040 + i}
                        </p>
                        <p className="text-xs text-slate-500">
                          Retail Client • 2 mins ago
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          45,000 XAF
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 h-4 border-emerald-200 text-emerald-600 bg-emerald-50"
                        >
                          Paid
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-6 text-xs h-9">
                  View All Transactions
                </Button>
              </Card>

              <Card className="p-6 bg-primary text-white shadow-xl shadow-primary/30 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-1">Stock Forecasting</h3>
                  <p className="text-primary-foreground/80 text-xs mb-4">
                    Based on last 30 days of sales
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span>Restock Urgency</span>
                      <span className="font-bold text-amber-300">High</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full">
                      <div className="w-3/4 h-full bg-amber-400 rounded-full"></div>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      8 products will stock out in the next 7 days at current
                      consumption rates.
                    </p>
                  </div>
                </div>
                <TrendingUp className="absolute -right-4 -bottom-4 size-32 opacity-10 rotate-12" />
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

{
  /* --- Helper Components for Cleanliness --- */
}

function NavItem({ icon: Icon, label, active = false }: any) {
  return (
    <a
      className={`
      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer
      ${active ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
    `}
    >
      <Icon className="size-5" />
      {label}
    </a>
  );
}

function StatCard({
  label,
  value,
  trend,
  subValue,
  icon: Icon,
  color,
  trendUp,
}: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className="p-6 border-slate-200 hover:border-primary/30 transition-all group shadow-sm">
      <div className="flex justify-between items-start">
        <div
          className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}
        >
          <Icon className="size-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center text-xs font-bold ${trendUp === false ? "text-red-500" : "text-emerald-500"}`}
          >
            {trendUp === true ? (
              <ArrowUpRight className="size-3 mr-1" />
            ) : trendUp === false ? (
              <ArrowDownRight className="size-3 mr-1" />
            ) : null}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </Card>
  );
}

function TableRow({ name, category, stock, expiry, status }: any) {
  const statusConfig: any = {
    critical: {
      label: "Expired / Low",
      class: "bg-red-100 text-red-700 border-red-200",
    },
    warning: {
      label: "Expiring Soon",
      class: "bg-amber-100 text-amber-700 border-amber-200",
    },
    out: {
      label: "Out of Stock",
      class: "bg-slate-100 text-slate-700 border-slate-200",
    },
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-colors group">
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{category}</p>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-slate-700">{stock}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar className="size-3" /> {expiry}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge
          variant="secondary"
          className={`font-bold text-[10px] ${statusConfig[status].class}`}
        >
          {statusConfig[status].label}
        </Badge>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-primary transition-all">
          <MoreVertical className="size-4" />
        </button>
      </td>
    </tr>
  );
}
