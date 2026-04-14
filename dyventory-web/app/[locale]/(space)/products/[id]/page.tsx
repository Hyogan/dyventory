import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import {
  Pencil,
  Archive,
  RotateCcw,
  Package,
  Tag,
  BarChart3,
  DollarSign,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { authFetch } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { VariantManager } from "@/features/products/components/VariantManager";
import { BarcodeDisplay } from "@/features/products/components/BarcodeDisplay";
import { ImageGallery } from "@/features/products/components/ImageGallery";
import type { Product } from "@/types";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getProduct(id: string): Promise<Product> {
  try {
    const res = await authFetch<{ data: Product }>(`/products/${id}`, {
      next: { tags: ["products", `product-${id}`] },
    });
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();

  const product = await getProduct(id);

  const stock = product.current_stock ?? 0;
  const threshold = Number(product.stock_alert_threshold ?? 0);
  const isLow = threshold > 0 && stock <= threshold && stock > 0;
  const isOut = stock <= 0;

  return (
    <div>
      <PageHeader
        title={product.name}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "../../dashboard" },
          { label: t("products.title"), href: ".." },
          { label: product.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/products/${product.id}/edit`}>
              <Button variant="outline" icon={<Pencil className="size-4" />}>
                {t("common.edit")}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6 max-w-5xl">
        {/* ── Header Card ──────────────────────────────── */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Product image */}
              <div className="size-28 rounded-xl bg-surface-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {product.images?.length ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/storage/${product.images[0]}`}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <Package className="size-12 text-fg-muted opacity-40" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold text-fg">{product.name}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-mono text-sm text-fg-muted">{product.sku}</span>
                      <StatusBadge status={product.status} />
                      {product.category && (
                        <Badge variant="secondary">{product.category.name}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {product.description && (
                  <p className="text-sm text-fg-subtle leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <StatCard
                    icon={<BarChart3 className="size-4 text-primary-500" />}
                    label={t("common.quantity")}
                    value={
                      <span className={isOut ? "text-danger-600" : isLow ? "text-warning-600" : ""}>
                        {Number(stock).toFixed(product.unit_of_measure === "kg" ? 3 : 0)} {product.unit_of_measure}
                      </span>
                    }
                    warning={isLow}
                  />
                  <StatCard
                    icon={<DollarSign className="size-4 text-success-500" />}
                    label={t("products.fields.sell_price")}
                    value={`${Number(product.price_sell_ttc).toLocaleString(locale)} XAF`}
                  />
                  {product.price_buy_ht && (
                    <StatCard
                      icon={<Tag className="size-4 text-fg-muted" />}
                      label={t("products.fields.buy_price")}
                      value={`${Number(product.price_buy_ht).toLocaleString(locale)} XAF`}
                    />
                  )}
                  {product.vat_rate && (
                    <StatCard
                      icon={<Layers className="size-4 text-fg-muted" />}
                      label={t("products.fields.vat_rate")}
                      value={`${product.vat_rate.name} (${product.vat_rate.rate}%)`}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Dynamic Attributes ───────────────────────── */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-xs text-fg-muted font-medium uppercase tracking-wide">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-fg font-medium">
                      {value === true
                        ? "Yes"
                        : value === false
                          ? "No"
                          : String(value ?? "—")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Images ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("products.fields.images")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageGallery
              productId={product.id}
              images={product.images ?? []}
            />
          </CardContent>
        </Card>

        {/* ── Barcode ──────────────────────────────────── */}
        <Card>
          <CardContent>
            <BarcodeDisplay
              productId={product.id}
              barcode={product.barcode}
              sku={product.sku}
            />
          </CardContent>
        </Card>

        {/* ── Variants ─────────────────────────────────── */}
        {product.has_variants && (
          <Card>
            <CardContent>
              <VariantManager
                productId={product.id}
                productSku={product.sku}
                variants={product.variants ?? []}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${warning ? "border-warning-200 bg-warning-50" : "border-border bg-surface-muted/50"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-fg-muted">{label}</span>
        {warning && <AlertTriangle className="size-3 text-warning-500" />}
      </div>
      <p className="text-sm font-semibold text-fg">{value}</p>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    return { title: `${product.name} — Dyventory` };
  } catch {
    return { title: "Product — Dyventory" };
  }
}
