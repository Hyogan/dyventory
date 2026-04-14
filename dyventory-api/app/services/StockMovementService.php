<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MovementType;
use App\Events\StockMovementRecorded;
use App\Models\Batch;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Records stock movements and keeps batch quantities in sync.
 *
 * - Entries (in_purchase, in_return): add to batch.current_quantity
 * - Exits (out_sale, out_loss, out_expiry, out_mortality): deduct from
 *   batches using FEFO (First Expired First Out), spreading across multiple
 *   batches if needed
 * - Adjustments: set batch.current_quantity to the explicit value provided
 *
 * Fires StockMovementRecorded after every successful movement.
 */
class StockMovementService
{
    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Paginated movement history with filters.
     *
     * Supported filters (all optional):
     *   - product_id  (int)
     *   - batch_id    (int)
     *   - type        (string: MovementType value)
     *   - user_id     (int)
     *   - date_from   (string: Y-m-d)
     *   - date_to     (string: Y-m-d)
     *   - per_page    (int: default 20, max 50)
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = StockMovement::with(['product', 'variant', 'batch', 'user'])
            ->orderBy('created_at', 'desc');

        if (! empty($filters['product_id'])) {
            $query->where('product_id', (int) $filters['product_id']);
        }

        if (! empty($filters['batch_id'])) {
            $query->where('batch_id', (int) $filters['batch_id']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->paginate($perPage);
    }

    // ─────────────────────────────────────────────
    // Record a movement
    // ─────────────────────────────────────────────

    /**
     * Record a stock entry (in_purchase or in_return).
     *
     * A batch_id is required for entries. The batch's current_quantity is
     * incremented by the given quantity.
     *
     * @param  array{
     *   product_id: int,
     *   batch_id: int,
     *   quantity: float|string,
     *   type?: string,
     *   variant_id?: int|null,
     *   user_id: int,
     *   notes?: string|null,
     *   reference_id?: int|null,
     *   reference_type?: string|null,
     * }  $data
     */
    public function recordEntry(array $data): StockMovement
    {
        $type = MovementType::from($data['type'] ?? MovementType::InPurchase->value);

        if (! $type->isEntry()) {
            throw ValidationException::withMessages([
                'type' => ['Movement type must be an entry type (in_purchase or in_return).'],
            ]);
        }

        $batch = Batch::findOrFail($data['batch_id']);
        $qty   = (float) $data['quantity'];

        if ($qty <= 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Entry quantity must be positive.'],
            ]);
        }

        return DB::transaction(function () use ($data, $type, $batch, $qty): StockMovement {
            $batch->increment('current_quantity', $qty);

            // Reactivate depleted batch if stock is added back
            if ($batch->status === 'depleted') {
                $batch->update(['status' => 'active']);
            }

            $movement = StockMovement::create([
                'product_id'     => $data['product_id'],
                'variant_id'     => $data['variant_id'] ?? null,
                'batch_id'       => $batch->id,
                'user_id'        => $data['user_id'],
                'type'           => $type->value,
                'quantity'       => $qty,
                'reference_id'   => $data['reference_id'] ?? null,
                'reference_type' => $data['reference_type'] ?? null,
                'notes'          => $data['notes'] ?? null,
            ]);

            StockMovementRecorded::dispatch($movement);

            return $movement;
        });
    }

    /**
     * Record a stock exit (out_sale, out_loss, out_expiry, out_mortality).
     *
     * If batch_id is provided the exit is charged to that specific batch.
     * Otherwise FEFO is applied automatically across available batches.
     *
     * Raises a validation error if the product has insufficient stock.
     *
     * @param  array{
     *   product_id: int,
     *   quantity: float|string,
     *   type?: string,
     *   variant_id?: int|null,
     *   batch_id?: int|null,
     *   user_id: int,
     *   notes?: string|null,
     *   reference_id?: int|null,
     *   reference_type?: string|null,
     * }  $data
     * @return StockMovement[]  One movement per batch consumed (FEFO may split across batches)
     */
    public function recordExit(array $data): array
    {
        $type = MovementType::from($data['type'] ?? MovementType::OutSale->value);

        if (! $type->isExit()) {
            throw ValidationException::withMessages([
                'type' => ['Movement type must be an exit type.'],
            ]);
        }

        $qty    = (float) $data['quantity'];

        if ($qty <= 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Exit quantity must be positive.'],
            ]);
        }

        return DB::transaction(function () use ($data, $type, $qty): array {
            $movements = [];

            if (! empty($data['batch_id'])) {
                // Exit from a specific batch
                $batch = Batch::findOrFail($data['batch_id']);
                $movements[] = $this->deductFromBatch($batch, $data, $type, $qty);
            } else {
                // FEFO: deduct from batches ordered by nearest expiry
                $batches = Batch::fefo()
                    ->where('product_id', $data['product_id'])
                    ->when(
                        ! empty($data['variant_id']),
                        fn ($q) => $q->where('variant_id', $data['variant_id']),
                    )
                    ->get();

                $remaining = $qty;

                foreach ($batches as $batch) {
                    if ($remaining <= 0) {
                        break;
                    }

                    $available = (float) $batch->current_quantity;
                    $toDeduct  = min($remaining, $available);

                    $movements[] = $this->deductFromBatch($batch, $data, $type, $toDeduct);
                    $remaining   = round($remaining - $toDeduct, 3);
                }

                if ($remaining > 0) {
                    throw ValidationException::withMessages([
                        'quantity' => ["Insufficient stock. Short by {$remaining} units."],
                    ]);
                }
            }

            foreach ($movements as $movement) {
                StockMovementRecorded::dispatch($movement);
            }

            return $movements;
        });
    }

    /**
     * Record an inventory adjustment for a specific batch.
     *
     * The quantity field is the *new absolute value* for batch.current_quantity.
     * A correction StockMovement is recorded with the signed delta.
     *
     * @param  array{
     *   product_id: int,
     *   batch_id: int,
     *   quantity: float|string,
     *   variant_id?: int|null,
     *   user_id: int,
     *   notes?: string|null,
     *   reference_id?: int|null,
     *   reference_type?: string|null,
     * }  $data
     */
    public function recordAdjustment(array $data): StockMovement
    {
        $batch       = Batch::findOrFail($data['batch_id']);
        $newQty      = (float) $data['quantity'];
        $currentQty  = (float) $batch->current_quantity;
        $delta       = round($newQty - $currentQty, 3); // signed: positive = gain, negative = loss

        return DB::transaction(function () use ($data, $batch, $newQty, $delta): StockMovement {
            $batch->update([
                'current_quantity' => $newQty,
                'status'           => $newQty <= 0 ? 'depleted' : 'active',
            ]);

            $movement = StockMovement::create([
                'product_id'     => $data['product_id'],
                'variant_id'     => $data['variant_id'] ?? null,
                'batch_id'       => $batch->id,
                'user_id'        => $data['user_id'],
                'type'           => MovementType::Adjustment->value,
                'quantity'       => $delta,
                'reference_id'   => $data['reference_id'] ?? null,
                'reference_type' => $data['reference_type'] ?? null,
                'notes'          => $data['notes'] ?? null,
            ]);

            StockMovementRecorded::dispatch($movement);

            return $movement;
        });
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Deduct qty from one batch, update status if depleted, return movement.
     */
    private function deductFromBatch(
        Batch $batch,
        array $data,
        MovementType $type,
        float $qty,
    ): StockMovement {
        $available = (float) $batch->current_quantity;

        if ($available < $qty) {
            throw ValidationException::withMessages([
                'quantity' => [
                    "Batch #{$batch->id} only has {$available} available, cannot deduct {$qty}.",
                ],
            ]);
        }

        $newQty = round($available - $qty, 3);

        $batch->update([
            'current_quantity' => $newQty,
            'status'           => $newQty <= 0 ? 'depleted' : 'active',
        ]);

        return StockMovement::create([
            'product_id'     => $data['product_id'],
            'variant_id'     => $data['variant_id'] ?? null,
            'batch_id'       => $batch->id,
            'user_id'        => $data['user_id'],
            'type'           => $type->value,
            'quantity'       => -$qty, // negative = exit
            'reference_id'   => $data['reference_id'] ?? null,
            'reference_type' => $data['reference_type'] ?? null,
            'notes'          => $data['notes'] ?? null,
        ]);
    }
}
