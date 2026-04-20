<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use Illuminate\Support\Facades\DB;

class CreditReportService
{
    private const CONFIRMED = [SaleStatus::Confirmed->value, SaleStatus::Delivered->value];

    /** Summary of outstanding credit for the period. */
    public function summary(string $from, string $to): array
    {
        $row = DB::table('sales')
            ->whereIn('status', self::CONFIRMED)
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('
                COUNT(*)                                    AS sale_count,
                COALESCE(SUM(total_ttc), 0)                 AS total_invoiced,
                COALESCE(SUM(total_ttc - amount_due), 0)    AS total_collected,
                COALESCE(SUM(amount_due), 0)                AS total_outstanding,
                COALESCE(SUM(CASE WHEN payment_status = ? THEN amount_due ELSE 0 END), 0) AS total_overdue
            ', [PaymentStatus::Overdue->value])
            ->first();

        return [
            'sale_count'        => (int) $row->sale_count,
            'total_invoiced'    => round((float) $row->total_invoiced, 2),
            'total_collected'   => round((float) $row->total_collected, 2),
            'total_outstanding' => round((float) $row->total_outstanding, 2),
            'total_overdue'     => round((float) $row->total_overdue, 2),
        ];
    }

    /** Outstanding credit grouped by client. */
    public function outstandingByClient(string $from, string $to, int $limit = 30): array
    {
        return DB::table('sales as s')
            ->leftJoin('clients as c', 'c.id', '=', 's.client_id')
            ->whereIn('s.status', self::CONFIRMED)
            ->whereNull('s.deleted_at')
            ->where('s.amount_due', '>', 0)
            ->whereBetween('s.created_at', [$from, $to])
            ->selectRaw('
                s.client_id,
                COALESCE(c.name, ?)                       AS client_name,
                COUNT(s.id)                               AS sale_count,
                COALESCE(SUM(s.total_ttc), 0)             AS total_invoiced,
                COALESCE(SUM(s.amount_due), 0)            AS outstanding,
                COALESCE(SUM(CASE WHEN s.payment_status = ? THEN s.amount_due ELSE 0 END), 0) AS overdue
            ', ['Anonymous', PaymentStatus::Overdue->value])
            ->groupBy('s.client_id', 'c.name')
            ->orderByDesc('outstanding')
            ->limit($limit)
            ->get()
            ->map(fn (object $r): array => [
                'client_id'      => $r->client_id,
                'client_name'    => $r->client_name,
                'sale_count'     => (int) $r->sale_count,
                'total_invoiced' => round((float) $r->total_invoiced, 2),
                'outstanding'    => round((float) $r->outstanding, 2),
                'overdue'        => round((float) $r->overdue, 2),
            ])
            ->all();
    }

    /** Overdue invoices with details. */
    public function overdueInvoices(int $limit = 50): array
    {
        return DB::table('sales as s')
            ->leftJoin('clients as c', 'c.id', '=', 's.client_id')
            ->whereIn('s.status', self::CONFIRMED)
            ->where('s.payment_status', PaymentStatus::Overdue->value)
            ->whereNull('s.deleted_at')
            ->selectRaw('
                s.id,
                s.sale_number,
                s.created_at,
                s.due_date,
                s.total_ttc,
                s.amount_due,
                s.client_id,
                COALESCE(c.name, ?) AS client_name,
                CURRENT_DATE - s.due_date::date AS days_overdue
            ', ['Anonymous'])
            ->orderByDesc(DB::raw('CURRENT_DATE - s.due_date::date'))
            ->limit($limit)
            ->get()
            ->map(fn (object $r): array => [
                'id'          => $r->id,
                'sale_number' => $r->sale_number,
                'created_at'  => $r->created_at,
                'due_date'    => $r->due_date,
                'total_ttc'   => round((float) $r->total_ttc, 2),
                'amount_due'  => round((float) $r->amount_due, 2),
                'client_id'   => $r->client_id,
                'client_name' => $r->client_name,
                'days_overdue' => (int) $r->days_overdue,
            ])
            ->all();
    }

    /**
     * Payments collected grouped by time period.
     *
     * @param  string  $granularity  'day' | 'week' | 'month' | 'quarter' | 'year'
     */
    public function collectedByPeriod(string $granularity, string $from, string $to): array
    {
        $granularity = $this->validGranularity($granularity);
        $trunc       = "date_trunc('{$granularity}', p.paid_at)";

        return DB::table('payments as p')
            ->whereBetween('p.paid_at', [$from, $to])
            ->selectRaw("
                {$trunc}                          AS period,
                COUNT(*)                          AS payment_count,
                COALESCE(SUM(p.amount), 0)        AS total_collected,
                p.payment_method
            ")
            ->groupByRaw("{$trunc}, p.payment_method")
            ->orderByRaw($trunc)
            ->get()
            ->map(fn (object $r): array => [
                'period'          => $r->period,
                'payment_method'  => $r->payment_method,
                'payment_count'   => (int) $r->payment_count,
                'total_collected' => round((float) $r->total_collected, 2),
            ])
            ->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validGranularity(string $g): string
    {
        return in_array($g, ['day', 'week', 'month', 'quarter', 'year'], true) ? $g : 'month';
    }
}
