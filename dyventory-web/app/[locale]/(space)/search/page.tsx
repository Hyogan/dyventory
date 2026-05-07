import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { authFetch } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Package, Users, Truck, Search } from "lucide-react";
import type { Product, Client, Supplier, PaginatedResponse } from "@/types";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

async function searchProducts(q: string): Promise<Product[]> {
  try {
    const res = await authFetch<PaginatedResponse<Product>>("/products", {
      params: { search: q, per_page: "8" },
      next: { revalidate: 0 },
    });
    return res.data;
  } catch {
    return [];
  }
}

async function searchClients(q: string): Promise<Client[]> {
  try {
    const res = await authFetch<PaginatedResponse<Client>>("/clients", {
      params: { search: q, per_page: "8" },
      next: { revalidate: 0 },
    });
    return res.data;
  } catch {
    return [];
  }
}

async function searchSuppliers(q: string): Promise<Supplier[]> {
  try {
    const res = await authFetch<PaginatedResponse<Supplier>>("/suppliers", {
      params: { search: q, per_page: "8" },
      next: { revalidate: 0 },
    });
    return res.data;
  } catch {
    return [];
  }
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations();
  const query = q?.trim() ?? "";

  const [products, clients, suppliers] = query
    ? await Promise.all([
        searchProducts(query),
        searchClients(query),
        searchSuppliers(query),
      ])
    : [[], [], []];

  const total = products.length + clients.length + suppliers.length;

  return (
    <div>
      <PageHeader
        title={query ? `"${query}"` : t("common.search")}
        description={
          query
            ? `${total} result${total !== 1 ? "s" : ""} found`
            : "Type a search term in the bar above and press Enter"
        }
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../dashboard" },
          { label: t("common.search") },
        ]}
      />

      {!query ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center text-fg-muted">
          <Search className="size-10" />
          <p className="text-sm">Start typing in the search bar to find products, clients, or suppliers.</p>
        </div>
      ) : total === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center text-fg-muted">
          <Search className="size-10" />
          <p className="text-sm">{t("common.no_results")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Products */}
          {products.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Package className="size-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-fg">
                  {t("products.title")} ({products.length})
                </h2>
              </div>
              <div className="card divide-y divide-border">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/${locale}/products/${p.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-muted/40 transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                      <Package className="size-4 text-fg-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-fg truncate">{p.name}</p>
                      <p className="text-xs text-fg-muted font-mono">{p.sku}</p>
                    </div>
                    <span className="text-xs text-fg-muted shrink-0 capitalize">
                      {p.status}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Clients */}
          {clients.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-fg">
                  {t("clients.title")} ({clients.length})
                </h2>
              </div>
              <div className="card divide-y divide-border">
                {clients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/${locale}/clients/${c.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-muted/40 transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                      <Users className="size-4 text-fg-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-fg truncate">{c.name}</p>
                      <p className="text-xs text-fg-muted">{c.email ?? c.phone ?? c.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Suppliers */}
          {suppliers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Truck className="size-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-fg">
                  {t("suppliers.title")} ({suppliers.length})
                </h2>
              </div>
              <div className="card divide-y divide-border">
                {suppliers.map((s) => (
                  <Link
                    key={s.id}
                    href={`/${locale}/suppliers/${s.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-muted/40 transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                      <Truck className="size-4 text-fg-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-fg truncate">{s.name}</p>
                      <p className="text-xs text-fg-muted">{s.email ?? s.phone ?? ""}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return { title: q ? `Search: "${q}" — Dyventory` : "Search — Dyventory" };
}
