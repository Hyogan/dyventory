<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SaleStatus;
use Illuminate\Support\Facades\DB;

class TvaReportService
{
    private const CONFIRMED = [SaleStatus::Confirmed->value, SaleStatus::Delivered->value];

    /** TVA collected summary for the period. */
    public function summary(string $from, string $to): array
    {
        $row = DB::table('sales')
            ->whereIn('status', self::CONFIRMED)
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('
                COUNT(*)                          AS sale_count,
                COALESCE(SUM(subtotal_ht), 0)     AS total_ht,
                COALESCE(SUM(total_vat), 0)       AS total_tva,
                COALESCE(SUM(total_ttc), 0)       AS total_ttc
            ')
            ->first();

        return [
            'sale_count' => (int) $row->sale_count,
            'total_ht'   => round((float) $row->total_ht, 2),
            'total_tva'  => round((float) $row->total_tva, 2),
            'total_ttc'  => round((float) $row->total_ttc, 2),
        ];
    }

    /**
     * TVA collected grouped by time period.
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
                COALESCE(SUM(subtotal_ht), 0)     AS total_ht,
                COALESCE(SUM(total_vat), 0)       AS total_tva,
                COALESCE(SUM(total_ttc), 0)       AS total_ttc
            ")
            ->groupByRaw($trunc)
            ->orderByRaw($trunc)
            ->get()
            ->map(fn (object $r): array => [
                'period'     => $r->period,
                'sale_count' => (int) $r->sale_count,
                'total_ht'   => round((float) $r->total_ht, 2),
                'total_tva'  => round((float) $r->total_tva, 2),
                'total_ttc'  => round((float) $r->total_ttc, 2),
            ])
            ->all();
    }

    /** TVA collected grouped by VAT rate applied at item level. */
    public function byRate(string $from, string $to): array
    {
        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->leftJoin('vat_rates as v', 'v.id', '=', 'si.vat_rate_id')
            ->whereIn('s.status', self::CONFIRMED)
            ->whereNull('s.deleted_at')
            ->whereBetween('s.created_at', [$from, $to])
            ->selectRaw('
                v.id                                                  AS vat_rate_id,
                COALESCE(v.name, ?)                                   AS vat_rate_name,
                COALESCE(v.rate, 0)                                   AS rate,
                COUNT(DISTINCT s.id)                                  AS sale_count,
                COALESCE(SUM(si.line_total_ht), 0)                   AS total_ht,
                COALESCE(SUM(si.line_total_ttc - si.line_total_ht), 0) AS total_tva,
                COALESCE(SUM(si.line_total_ttc), 0)                  AS total_ttc
            ', ['No VAT'])
            ->groupBy('v.id', 'v.name', 'v.rate')
            ->orderByDesc('total_tva')
            ->get()
            ->map(fn (object $r): array => [
                'vat_rate_id'   => $r->vat_rate_id,
                'vat_rate_name' => $r->vat_rate_name,
                'rate'          => round((float) $r->rate, 4),
                'sale_count'    => (int) $r->sale_count,
                'total_ht'      => round((float) $r->total_ht, 2),
                'total_tva'     => round((float) $r->total_tva, 2),
                'total_ttc'     => round((float) $r->total_ttc, 2),
            ])
            ->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validGranularity(string $g): string
    {
        return in_array($g, ['day', 'week', 'month', 'quarter', 'year'], true) ? $g : 'month';
    }
}
