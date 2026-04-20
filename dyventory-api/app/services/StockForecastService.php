<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;

class StockForecastService
{
    private const ANALYSIS_DAYS = 90;

    /**
     * Forecast days-to-stockout for all active products with stock.
     * Uses average daily consumption over the last 90 days.
     *
     * @return array<int, array{
     *     id: int, name: string, sku: string, unit: string,
     *     current_stock: float, avg_daily_consumption: float,
     *     days_to_stockout: int|null, urgency: string
     * }>
     */
    public function forecast(int $limit = 100): array
    {
        $since = now()->subDays(self::ANALYSIS_DAYS)->toDateTimeString();

        $rows = DB::table('products as p')
            ->where('p.status', 'active')
            ->whereNull('p.deleted_at')
            ->whereExists(function ($q) {
                $q->from('batches as b')
                  ->whereColumn('b.product_id', 'p.id')
                  ->where('b.status', 'active')
                  ->where('b.current_quantity', '>', 0);
            })
            ->selectRaw('
                p.id,
                p.name,
                p.sku,
                p.unit_of_measure,
                p.stock_alert_threshold,
                COALESCE((
                    SELECT SUM(b.current_quantity)
                    FROM batches b
                    WHERE b.product_id = p.id AND b.status = ?
                ), 0) AS current_stock,
                COALESCE((
                    SELECT SUM(ABS(sm.quantity))
                    FROM stock_movements sm
                    WHERE sm.product_id = p.id
                      AND sm.movement_type = ?
                      AND sm.created_at >= ?
                ), 0) AS sold_last_period
            ', ['active', 'out_sale', $since])
            ->orderByRaw('current_stock ASC')
            ->limit($limit)
            ->get();

        return $rows->map(function (object $r): array {
            $stock     = (float) $r->current_stock;
            $sold      = (float) $r->sold_last_period;
            $avgDaily  = round($sold / self::ANALYSIS_DAYS, 4);
            $threshold = (float) $r->stock_alert_threshold;

            $daysToStockout = ($avgDaily > 0)
                ? (int) ceil($stock / $avgDaily)
                : null;

            $urgency = $this->urgency($stock, $threshold, $daysToStockout);

            return [
                'id'                    => $r->id,
                'name'                  => $r->name,
                'sku'                   => $r->sku,
                'unit'                  => $r->unit_of_measure,
                'current_stock'         => round($stock, 3),
                'avg_daily_consumption' => $avgDaily,
                'days_to_stockout'      => $daysToStockout,
                'urgency'               => $urgency,
            ];
        })->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Return urgency colour string based on stock level and days-to-stockout. */
    private function urgency(float $stock, float $threshold, ?int $days): string
    {
        if ($stock <= 0) {
            return 'critical';          // out of stock
        }

        if ($days !== null) {
            if ($days <= 7) {
                return 'critical';      // runs out in 1 week
            }

            if ($days <= 30) {
                return 'warning';       // runs out in 1 month
            }
        }

        if ($threshold > 0 && $stock <= $threshold) {
            return 'warning';           // below alert threshold
        }

        return 'ok';
    }
}
