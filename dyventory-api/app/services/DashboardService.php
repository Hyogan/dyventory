<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    private const CACHE_KEY = 'dashboard.stats';
    private const TTL_MINUTES = 5;

    /** Return full dashboard stats, cached for 5 minutes. */
    public function stats(): array
    {
        return Cache::remember(self::CACHE_KEY, now()->addMinutes(self::TTL_MINUTES), function (): array {
            return [
                'revenue'       => $this->revenueStats(),
                'sales_today'   => $this->salesToday(),
                'stock_value'   => $this->totalStockValue(),
                'alerts'        => $this->alertsSummary(),
                'top_products'  => $this->topProducts(),
                'recent_sales'  => $this->recentSales(),
            ];
        });
    }

    /** Invalidate the dashboard cache (called by event listeners). */
    public function invalidate(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    // ── Private computation methods ───────────────────────────────────────────

    private function revenueStats(): array
    {
        $confirmedStatuses = [SaleStatus::Confirmed->value, SaleStatus::Delivered->value];

        $base = DB::table('sales')
            ->whereIn('status', $confirmedStatuses)
            ->whereNull('deleted_at');

        // Today vs yesterday
        $todayRevenue = (clone $base)
            ->whereDate('created_at', today())
            ->sum('total_ttc');

        $yesterdayRevenue = (clone $base)
            ->whereDate('created_at', today()->subDay())
            ->sum('total_ttc');

        // This week vs last week
        $weekStart = now()->startOfWeek();
        $weekRevenue = (clone $base)
            ->where('created_at', '>=', $weekStart)
            ->sum('total_ttc');

        $lastWeekRevenue = (clone $base)
            ->whereBetween('created_at', [
                now()->subWeek()->startOfWeek(),
                now()->subWeek()->endOfWeek(),
            ])
            ->sum('total_ttc');

        // This month vs last month
        $monthStart = now()->startOfMonth();
        $monthRevenue = (clone $base)
            ->where('created_at', '>=', $monthStart)
            ->sum('total_ttc');

        $lastMonthRevenue = (clone $base)
            ->whereBetween('created_at', [
                now()->subMonth()->startOfMonth(),
                now()->subMonth()->endOfMonth(),
            ])
            ->sum('total_ttc');

        return [
            'today'           => round((float) $todayRevenue, 2),
            'today_change'    => $this->percentChange((float) $yesterdayRevenue, (float) $todayRevenue),
            'week'            => round((float) $weekRevenue, 2),
            'week_change'     => $this->percentChange((float) $lastWeekRevenue, (float) $weekRevenue),
            'month'           => round((float) $monthRevenue, 2),
            'month_change'    => $this->percentChange((float) $lastMonthRevenue, (float) $monthRevenue),
        ];
    }

    private function salesToday(): int
    {
        return (int) DB::table('sales')
            ->whereIn('status', [SaleStatus::Confirmed->value, SaleStatus::Delivered->value])
            ->whereNull('deleted_at')
            ->whereDate('created_at', today())
            ->count();
    }

    private function totalStockValue(): array
    {
        $row = DB::table('batches as b')
            ->join('products as p', 'p.id', '=', 'b.product_id')
            ->where('b.status', 'active')
            ->where('b.current_quantity', '>', 0)
            ->whereNull('p.deleted_at')
            ->selectRaw('
                COALESCE(SUM(b.current_quantity * p.price_buy_ht),  0) AS value_ht,
                COALESCE(SUM(b.current_quantity * p.price_sell_ttc), 0) AS value_ttc
            ')
            ->first();

        return [
            'value_ht'  => round((float) $row->value_ht, 2),
            'value_ttc' => round((float) $row->value_ttc, 2),
        ];
    }

    private function alertsSummary(): array
    {
        // Low stock: products where total active batch qty <= threshold
        $lowStock = (int) DB::table('products as p')
            ->whereNull('p.deleted_at')
            ->where('p.status', 'active')
            ->where('p.stock_alert_threshold', '>', 0)
            ->whereRaw(
                '(SELECT COALESCE(SUM(b.current_quantity), 0) FROM batches b WHERE b.product_id = p.id AND b.status = ?) <= p.stock_alert_threshold',
                ['active'],
            )
            ->count();

        // Expiry soon: active batches expiring in next 30 days
        $expirySoon = (int) DB::table('batches')
            ->where('status', 'active')
            ->where('current_quantity', '>', 0)
            ->whereNotNull(DB::raw("(attributes->>'expiry_date')"))
            ->whereRaw(
                "(attributes->>'expiry_date')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'",
            )
            ->count();

        // Overdue credits: confirmed/delivered sales with amount_due > 0 and due_date passed
        $overdueCredits = (int) DB::table('sales')
            ->whereIn('status', [SaleStatus::Confirmed->value, SaleStatus::Delivered->value])
            ->where('payment_status', PaymentStatus::Overdue->value)
            ->whereNull('deleted_at')
            ->count();

        return [
            'low_stock'       => $lowStock,
            'expiry_soon'     => $expirySoon,
            'overdue_credits' => $overdueCredits,
        ];
    }

    private function topProducts(int $limit = 5): array
    {
        return DB::table('sale_items as si')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->whereIn('s.status', [SaleStatus::Confirmed->value, SaleStatus::Delivered->value])
            ->whereNull('s.deleted_at')
            ->whereNull('p.deleted_at')
            ->where('s.created_at', '>=', now()->startOfMonth())
            ->selectRaw('
                p.id,
                p.name,
                p.sku,
                p.unit_of_measure,
                COALESCE(SUM(si.line_total_ttc), 0) AS revenue,
                COALESCE(SUM(si.quantity), 0)        AS quantity_sold
            ')
            ->groupBy('p.id', 'p.name', 'p.sku', 'p.unit_of_measure')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn (object $r): array => [
                'id'            => $r->id,
                'name'          => $r->name,
                'sku'           => $r->sku,
                'unit'          => $r->unit_of_measure,
                'revenue'       => round((float) $r->revenue, 2),
                'quantity_sold' => round((float) $r->quantity_sold, 3),
            ])
            ->all();
    }

    private function recentSales(int $limit = 10): array
    {
        return DB::table('sales as s')
            ->leftJoin('clients as c', 'c.id', '=', 's.client_id')
            ->whereNull('s.deleted_at')
            ->whereIn('s.status', [SaleStatus::Confirmed->value, SaleStatus::Delivered->value])
            ->selectRaw('
                s.id,
                s.sale_number,
                s.status,
                s.payment_status,
                s.total_ttc,
                s.amount_due,
                s.created_at,
                c.name AS client_name
            ')
            ->orderByDesc('s.created_at')
            ->limit($limit)
            ->get()
            ->map(fn (object $r): array => [
                'id'             => $r->id,
                'sale_number'    => $r->sale_number,
                'status'         => $r->status,
                'payment_status' => $r->payment_status,
                'total_ttc'      => round((float) $r->total_ttc, 2),
                'amount_due'     => round((float) $r->amount_due, 2),
                'client_name'    => $r->client_name,
                'created_at'     => $r->created_at,
            ])
            ->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Compute percentage change from $prev to $curr. Returns null if no prior data. */
    private function percentChange(float $prev, float $curr): ?float
    {
        if ($prev == 0.0) {
            return null;
        }

        return round((($curr - $prev) / $prev) * 100, 1);
    }
}
