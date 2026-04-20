import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { DashboardTopProduct } from "@/types";

interface DashboardTopProductsProps {
  products: DashboardTopProduct[];
  locale: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export async function DashboardTopProducts({ products, locale }: DashboardTopProductsProps) {
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");
  const tr = await getTranslations("reports.cols");

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-fg text-sm">{t("top_products")}</h3>
        <Link href={`/${locale}/reports/sales`} className="text-xs text-primary-600 hover:underline">
          {t("see_all")}
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="px-5 py-8 text-sm text-fg-muted text-center">{t("no_top_products")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wide">
                {tr("product")}
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wide">
                {tr("qty_sold")}
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wide">
                {tr("revenue_ttc")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-fg truncate max-w-[14rem]">{p.name}</p>
                  <p className="text-xs text-fg-muted">{p.sku}</p>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-fg-muted">
                  {fmt(p.quantity_sold)} {p.unit}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-fg">
                  {fmt(p.revenue)} F
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
