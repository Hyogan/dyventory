<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Batch;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Checks stock conditions and creates notifications for actionable alerts:
 *
 * - LOW_STOCK   — product's current_stock ≤ alert_threshold (and > 0)
 * - ZERO_STOCK  — product's current_stock = 0
 * - EXPIRY      — batch with expiry_date within the next N days
 * - MORTALITY   — living product (snails) with batch older than max_age_days
 *
 * Notifications are stored in the `notifications` table using Laravel's
 * built-in notification morphs format. Recipients are all Admin + Manager users.
 */
class AlertService
{
    private const int EXPIRY_WARNING_DAYS = 30;

    // ─────────────────────────────────────────────
    // Orchestration
    // ─────────────────────────────────────────────

    /**
     * Run all alert checks and fire notifications.
     * Called by CheckStockAlerts job (daily schedule + post-movement trigger).
     *
     * @return array{low_stock: int, zero_stock: int, expiry: int, mortality: int}
     */
    public function checkAll(): array
    {
        $counts = [
            'low_stock'  => $this->checkLowStock(),
            'zero_stock' => $this->checkZeroStock(),
            'expiry'     => $this->checkExpiringBatches(),
            'mortality'  => $this->checkMortality(),
        ];

        logger()->info('AlertService::checkAll completed', $counts);

        return $counts;
    }

    // ─────────────────────────────────────────────
    // Individual checks
    // ─────────────────────────────────────────────

    /**
     * Products whose stock is at or below their alert_threshold (but above 0).
     * Returns the number of notifications created.
     */
    public function checkLowStock(): int
    {
        // Use a subquery — current_stock is a PHP accessor, not a DB column
        $stockSub = 'COALESCE((SELECT SUM(b.current_quantity) FROM batches b WHERE b.product_id = products.id AND b.status = \'active\'), 0)';

        $products = Product::active()
            ->whereNotNull('stock_alert_threshold')
            ->whereRaw("stock_alert_threshold > 0")
            ->whereRaw("{$stockSub} <= stock_alert_threshold")
            ->whereRaw("{$stockSub} > 0")
            ->get();

        return $this->notify($products, 'low_stock', function (Product $p): array {
            $stock = $p->current_stock;
            return [
                'message'         => "Low stock alert: {$p->name} has {$stock} units remaining (threshold: {$p->stock_alert_threshold}).",
                'product_id'      => $p->id,
                'product_name'    => $p->name,
                'current_stock'   => $stock,
                'alert_threshold' => (float) $p->stock_alert_threshold,
            ];
        });
    }

    /**
     * Products with zero stock.
     * Returns the number of notifications created.
     */
    public function checkZeroStock(): int
    {
        $stockSub = 'COALESCE((SELECT SUM(b.current_quantity) FROM batches b WHERE b.product_id = products.id AND b.status = \'active\'), 0)';

        $products = Product::active()
            ->whereRaw("{$stockSub} = 0")
            ->get();

        return $this->notify($products, 'zero_stock', function (Product $p): array {
            return [
                'message'      => "Zero stock: {$p->name} is completely out of stock.",
                'product_id'   => $p->id,
                'product_name' => $p->name,
            ];
        });
    }

    /**
     * Active batches whose expiry_date (stored in JSONB attributes) is within
     * EXPIRY_WARNING_DAYS days from today.
     * Returns the number of notifications created.
     */
    public function checkExpiringBatches(): int
    {
        $cutoff  = now()->addDays(self::EXPIRY_WARNING_DAYS)->toDateString();
        $today   = now()->toDateString();

        $batches = Batch::active()
            ->with('product:id,name')
            ->whereRaw(
                "(attributes->>'expiry_date') IS NOT NULL
                 AND (attributes->>'expiry_date')::date BETWEEN ?::date AND ?::date",
                [$today, $cutoff],
            )
            ->get();

        if ($batches->isEmpty()) {
            return 0;
        }

        $recipients = $this->alertRecipients();
        $count      = 0;

        foreach ($batches as $batch) {
            $daysLeft = $batch->daysUntilExpiry();
            $data     = [
                'type'         => 'batch_expiry',
                'message'      => "Batch {$batch->batch_number} of {$batch->product->name} expires in {$daysLeft} day(s).",
                'batch_id'     => $batch->id,
                'product_id'   => $batch->product_id,
                'product_name' => $batch->product->name,
                'expiry_date'  => $batch->getExpiryDate()?->toDateString(),
                'days_left'    => $daysLeft,
            ];

            $this->insertNotifications($recipients, 'batch_expiry', $data);
            $count++;
        }

        return $count;
    }

    /**
     * Living-product batches (snails) where received_at is older than the
     * product's max_age_days attribute.  This fires a mortality risk alert.
     *
     * Products are identified by having a batch-level schema field with
     * key = 'max_age_days' in their category schema. If the field is missing
     * for a product, its batches are skipped.
     *
     * Returns the number of notifications created.
     */
    public function checkMortality(): int
    {
        // Find products whose category schema has a 'max_age_days' product field
        $products = Product::active()
            ->with(['category', 'batches' => fn($q) => $q->active()])
            ->get()
            ->filter(function (Product $p): bool {
                $schema = $p->category->field_schema ?? [];
                foreach ($schema as $field) {
                    if (($field['key'] ?? '') === 'max_age_days' && ($field['applies_to'] ?? '') === 'product') {
                        return true;
                    }
                }
                return false;
            });

        if ($products->isEmpty()) {
            return 0;
        }

        $recipients = $this->alertRecipients();
        $count      = 0;

        foreach ($products as $product) {
            $maxAgeDays = (int) ($product->attributes['max_age_days'] ?? 0);

            if ($maxAgeDays <= 0) {
                continue;
            }

            foreach ($product->batches as $batch) {
                $age = (int) $batch->received_at->diffInDays(now());

                if ($age >= $maxAgeDays) {
                    $data = [
                        'type'         => 'mortality_risk',
                        'message'      => "Mortality risk: batch {$batch->batch_number} of {$product->name} is {$age} days old (max: {$maxAgeDays}).",
                        'batch_id'     => $batch->id,
                        'product_id'   => $product->id,
                        'product_name' => $product->name,
                        'age_days'     => $age,
                        'max_age_days' => $maxAgeDays,
                    ];

                    $this->insertNotifications($recipients, 'mortality_risk', $data);
                    $count++;
                }
            }
        }

        return $count;
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * @template T of \Illuminate\Database\Eloquent\Model
     * @param  Collection<int, T>            $models
     * @param  callable(T): array<string, mixed>  $dataFn
     */
    private function notify(Collection $models, string $type, callable $dataFn): int
    {
        if ($models->isEmpty()) {
            return 0;
        }

        $recipients = $this->alertRecipients();
        $count      = 0;

        foreach ($models as $model) {
            $data = array_merge(['type' => $type], $dataFn($model));
            $this->insertNotifications($recipients, $type, $data);
            $count++;
        }

        return $count;
    }

    /**
     * Bulk-insert notifications for all recipients.
     *
     * @param  Collection<int, User>     $recipients
     * @param  array<string, mixed>      $data
     */
    private function insertNotifications(Collection $recipients, string $type, array $data): void
    {
        $now  = now();
        $rows = $recipients->map(fn(User $user) => [
            'id'              => \Illuminate\Support\Str::uuid()->toString(),
            'type'            => "App\\Notifications\\Stock\\" . class_basename($type),
            'notifiable_type' => User::class,
            'notifiable_id'   => $user->id,
            'data'            => json_encode($data),
            'read_at'         => null,
            'created_at'      => $now,
            'updated_at'      => $now,
        ])->all();

        DB::table('notifications')->insert($rows);
    }

    /**
     * All Admin and Manager users who should receive stock alerts.
     *
     * @return Collection<int, User>
     */
    private function alertRecipients(): Collection
    {
        return User::whereIn('role', ['admin', 'manager'])->get(['id']);
    }
}
