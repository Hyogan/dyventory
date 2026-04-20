<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SaleStatus;
use Illuminate\Support\Facades\DB;

class SalesReportService
{
    private const CONFIRMED = [SaleStatus::Confirmed->value, SaleStatus::Delivered->value];

    /** High-level summary for the period. */
    public function summary(string $from, string $to): array
    {
        $row = DB::table('sales')
            ->whereIn('status', self::CONFIRMED)
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('
                COUNT(*)                          AS sale_count,
                COALESCE(SUM(total_ttc), 0)       AS revenue_ttc,
                COALESCE(SUM(subtotal_ht), 0)     AS revenue_ht,
                COALESCE(SUM(total_vat), 0)       AS total_tva,
                COALESCE(SUM(discount_amount), 0) AS total_discount,
                COALESCE(SUM(amount_due), 0)      AS total_outstanding,
                CASE WHEN COUNT(*) > 0
                     THEN SUM(total_ttc) / COUNT(*)
                     ELSE 0
                END                               AS avg_ticket
            ')
            ->first();

        return [
            'sale_count'        => (int) $row->sale_count,
            'revenue_ttc'       => round((float) $row->revenue_ttc, 2),
            'revenue_ht'        => round((float) $row->revenue_ht, 2),
            'total_tva'         => round((float) $row->total_tva, 2),
            'total_discount'    => round((float) $row->total_discount, 2),
            'total_outstanding' => round((float) $row->total_outstanding, 2),
            'avg_ticket'        => round((float) $row->avg_ticket, 2),
        ];
    }

    /**
     * Revenue grouped by time period using PostgreSQL date_trunc.
     *
     * @param  string  $granularity  'day' | 'week' | 'month' | 'quarter' | 'year'
     */
    public function byPeriod(string $granularity, string $from, string $to): array
    {
        $granularity = $this->validGranularity($granularity);
        $trunc       = "date_trunc('{$granularity}', created_at)";

        return DB::table('sales')
            ->whereIn('status', self::CONFIRMED)
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("
                {$trunc}                          AS period,
                COUNT(*)                          AS sale_count,
                COALESCE(SUM(total_ttc), 0)       AS revenue_ttc,
                COALESCE(SUM(subtotal_ht), 0)     AS revenue_ht,
                COALESCE(SUM(total_vat), 0)       AS total_tva,
                COALESCE(SUM(discount_amount), 0) AS total_discount
            ")
            ->groupByRaw($trunc)
            ->orderByRaw($trunc)
            ->get()
            ->map(fn (object $r): array => [
                'period'        => $r->period,
                'sale_count'    => (int) $r->sale_count,
                'revenue_ttc'   => round((float) $r->revenue_ttc, 2),
                'revenue_ht'    => round((float) $r->revenue_ht, 2),
                'total_tva'     => round((float) $r->total_tva, 2),
                'total_discount' => round((float) $r->total_discount, 2),
            ])
            ->all();
    }

    /** Revenue grouped by vendor (user who created the sale). */
    public function byVendor(string $from, string $to): array
    {
        return DB::table('sales as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->whereIn('s.status', self::CONFIRMED)
            ->whereNull('s.deleted_at')
            ->whereBetween('s.created_at', [$from, $to])
            ->selectRaw('
                u.id,
                u.name,
                COUNT(s.id)                          AS sale_count,
                COALESCE(SUM(s.total_ttc), 0)        AS revenue_ttc,
                CASE WHEN COUNT(s.id) > 0
                     THEN SUM(s.total_ttc) / COUNT(s.id)
                     ELSE 0
                END                                  AS avg_ticket
            ')
            ->groupBy('u.id', 'u.name')
            ->orderByDesc('revenue_ttc')
            ->get()
            ->map(fn (object $r): array => [
                'user_id'    => $r->id,
                'user_name'  => $r->name,
                'sale_count' => (int) $r->sale_count,
                'revenue_ttc' => round((float) $r->revenue_ttc, 2),
                'avg_ticket' => round((float) $r->avg_ticket, 2),
            ])
            ->all();
    }

    /** Revenue grouped by product category. */
    public function byCategory(string $from, string $to): array
    {
        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->join('categories as c', 'c.id', '=', 'p.category_id')
            ->whereIn('s.status', self::CONFIRMED)
            ->whereNull('s.deleted_at')
            ->whereNull('p.deleted_at')
            ->whereBetween('s.created_at', [$from, $to])
            ->selectRaw('
                c.id,
                c.name,
                COUNT(DISTINCT s.id)                    AS sale_count,
                COALESCE(SUM(si.line_total_ttc), 0)     AS revenue_ttc,
                COALESCE(SUM(si.quantity), 0)           AS quantity_sold
            ')
            ->groupBy('c.id', 'c.name')
            ->orderByDesc('revenue_ttc')
            ->get()
            ->map(fn (object $r): array => [
                'category_id'   => $r->id,
                'category_name' => $r->name,
                'sale_count'    => (int) $r->sale_count,
                'revenue_ttc'   => round((float) $r->revenue_ttc, 2),
                'quantity_sold' => round((float) $r->quantity_sold, 3),
            ])
            ->all();
    }

    /** Revenue grouped by client. */
    public function byClient(string $from, string $to, int $limit = 20): array
    {
        return DB::table('sales as s')
            ->leftJoin('clients as c', 'c.id', '=', 's.client_id')
            ->whereIn('s.status', self::CONFIRMED)
            ->whereNull('s.deleted_at')
            ->whereBetween('s.created_at', [$from, $to])
            ->selectRaw('
                s.client_id,
                COALESCE(c.name, ?) AS client_name,
                COUNT(s.id)                          AS sale_count,
                COALESCE(SUM(s.total_ttc), 0)        AS revenue_ttc,
                COALESCE(SUM(s.amount_due), 0)       AS outstanding
            ', ['Anonymous'])
            ->groupBy('s.client_id', 'c.name')
            ->orderByDesc('revenue_ttc')
            ->limit($limit)
            ->get()
            ->map(fn (object $r): array => [
                'client_id'   => $r->client_id,
                'client_name' => $r->client_name,
                'sale_count'  => (int) $r->sale_count,
                'revenue_ttc' => round((float) $r->revenue_ttc, 2),
                'outstanding' => round((float) $r->outstanding, 2),
            ])
            ->all();
    }

    /** Revenue grouped by payment method. */
    public function byPaymentMethod(string $from, string $to): array
    {
        return DB::table('sales')
            ->whereIn('status', self::CONFIRMED)
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('
                COALESCE(payment_method, ?) AS payment_method,
                COUNT(*)                      AS sale_count,
                COALESCE(SUM(total_ttc), 0)   AS revenue_ttc
            ', ['unknown'])
            ->groupBy('payment_method')
            ->orderByDesc('revenue_ttc')
            ->get()
            ->map(fn (object $r): array => [
                'payment_method' => $r->payment_method,
                'sale_count'     => (int) $r->sale_count,
                'revenue_ttc'    => round((float) $r->revenue_ttc, 2),
            ])
            ->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validGranularity(string $g): string
    {
        return in_array($g, ['day', 'week', 'month', 'quarter', 'year'], true) ? $g : 'month';
    }
}
