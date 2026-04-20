<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;

class StockReportService
{
    /** Current stock value grouped by category. */
    public function valueByCategory(): array
    {
        return DB::table('batches as b')
            ->join('products as p', 'p.id', '=', 'b.product_id')
            ->join('categories as c', 'c.id', '=', 'p.category_id')
            ->where('b.status', 'active')
            ->where('b.current_quantity', '>', 0)
            ->whereNull('p.deleted_at')
            ->selectRaw('
                c.id,
                c.name,
                COUNT(DISTINCT p.id)                               AS product_count,
                COALESCE(SUM(b.current_quantity), 0)               AS total_quantity,
                COALESCE(SUM(b.current_quantity * p.price_buy_ht),  0) AS value_ht,
                COALESCE(SUM(b.current_quantity * p.price_sell_ttc), 0) AS value_ttc
            ')
            ->groupBy('c.id', 'c.name')
            ->orderByDesc('value_ttc')
            ->get()
            ->map(fn (object $r): array => [
                'category_id'   => $r->id,
                'category_name' => $r->name,
                'product_count' => (int) $r->product_count,
                'total_quantity' => round((float) $r->total_quantity, 3),
                'value_ht'      => round((float) $r->value_ht, 2),
                'value_ttc'     => round((float) $r->value_ttc, 2),
            ])
            ->all();
    }

    /** Stock movements (losses) grouped by type and period. */
    public function lossesByPeriod(string $granularity, string $from, string $to): array
    {
        $granularity = $this->validGranularity($granularity);
        $lossTypes   = ['out_loss', 'out_expiry', 'out_mortality'];
        $trunc       = "date_trunc('{$granularity}', sm.created_at)";

        return DB::table('stock_movements as sm')
            ->join('products as p', 'p.id', '=', 'sm.product_id')
            ->whereIn('sm.movement_type', $lossTypes)
            ->whereBetween('sm.created_at', [$from, $to])
            ->whereNull('p.deleted_at')
            ->selectRaw("
                {$trunc}                                        AS period,
                sm.movement_type,
                COUNT(*)                                        AS movement_count,
                COALESCE(SUM(ABS(sm.quantity)), 0)              AS total_quantity,
                COALESCE(SUM(ABS(sm.quantity) * p.price_buy_ht), 0) AS estimated_loss_ht
            ")
            ->groupByRaw("{$trunc}, sm.movement_type")
            ->orderByRaw($trunc)
            ->orderBy('sm.movement_type')
            ->get()
            ->map(fn (object $r): array => [
                'period'           => $r->period,
                'movement_type'    => $r->movement_type,
                'movement_count'   => (int) $r->movement_count,
                'total_quantity'   => round((float) $r->total_quantity, 3),
                'estimated_loss_ht' => round((float) $r->estimated_loss_ht, 2),
            ])
            ->all();
    }

    /** Products with zero movement in the last N days (dormant). */
    public function dormantProducts(int $days = 90, int $limit = 50): array
    {
        $since = now()->subDays($days)->toDateTimeString();

        // Products with active stock but no sales movements since $since
        return DB::table('products as p')
            ->where('p.status', 'active')
            ->whereNull('p.deleted_at')
            ->whereExists(function ($q) {
                // has active stock
                $q->from('batches as b')
                  ->whereColumn('b.product_id', 'p.id')
                  ->where('b.status', 'active')
                  ->where('b.current_quantity', '>', 0);
            })
            ->whereNotExists(function ($q) use ($since) {
                // no out_sale movement since $since
                $q->from('stock_movements as sm')
                  ->whereColumn('sm.product_id', 'p.id')
                  ->where('sm.movement_type', 'out_sale')
                  ->where('sm.created_at', '>=', $since);
            })
            ->selectRaw('
                p.id,
                p.name,
                p.sku,
                p.unit_of_measure,
                (SELECT COALESCE(SUM(b2.current_quantity), 0)
                 FROM batches b2
                 WHERE b2.product_id = p.id AND b2.status = ?) AS stock_qty,
                (SELECT MAX(sm2.created_at)
                 FROM stock_movements sm2
                 WHERE sm2.product_id = p.id AND sm2.movement_type = ?) AS last_sale_at
            ', ['active', 'out_sale'])
            ->orderByRaw('last_sale_at ASC NULLS FIRST')
            ->limit($limit)
            ->get()
            ->map(fn (object $r): array => [
                'id'            => $r->id,
                'name'          => $r->name,
                'sku'           => $r->sku,
                'unit'          => $r->unit_of_measure,
                'stock_qty'     => round((float) $r->stock_qty, 3),
                'last_sale_at'  => $r->last_sale_at,
            ])
            ->all();
    }

    /** Stock rotation rate: sold qty / avg stock qty for a period. */
    public function rotationRate(string $from, string $to): array
    {
        return DB::table('products as p')
            ->where('p.status', 'active')
            ->whereNull('p.deleted_at')
            ->selectRaw('
                p.id,
                p.name,
                p.sku,
                p.unit_of_measure,
                COALESCE((
                    SELECT SUM(ABS(sm.quantity))
                    FROM stock_movements sm
                    WHERE sm.product_id = p.id
                      AND sm.movement_type = ?
                      AND sm.created_at BETWEEN ? AND ?
                ), 0) AS sold_qty,
                COALESCE((
                    SELECT SUM(b.current_quantity)
                    FROM batches b
                    WHERE b.product_id = p.id AND b.status = ?
                ), 0) AS current_stock
            ', ['out_sale', $from, $to, 'active'])
            ->having(DB::raw('COALESCE((SELECT SUM(b.current_quantity) FROM batches b WHERE b.product_id = p.id AND b.status = ?), 0)'), '>', 0)
            ->addBinding('active', 'having')
            ->orderByRaw('sold_qty DESC')
            ->limit(100)
            ->get()
            ->map(function (object $r): array {
                $current = (float) $r->current_stock;
                $sold    = (float) $r->sold_qty;
                $rate    = $current > 0 ? round($sold / $current, 2) : null;

                return [
                    'id'            => $r->id,
                    'name'          => $r->name,
                    'sku'           => $r->sku,
                    'unit'          => $r->unit_of_measure,
                    'sold_qty'      => round($sold, 3),
                    'current_stock' => round($current, 3),
                    'rotation_rate' => $rate,
                ];
            })
            ->all();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validGranularity(string $g): string
    {
        return in_array($g, ['day', 'week', 'month', 'quarter', 'year'], true) ? $g : 'month';
    }
}
