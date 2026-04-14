<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Batch;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

/**
 * Batch CRUD with dynamic field validation via FieldSchemaService.
 *
 * Batch-level dynamic fields are those with applies_to = 'batch' in the
 * parent product's category field schema (e.g. expiry_date, lot_number).
 */
class BatchService
{
    public function __construct(
        private readonly FieldSchemaService $fieldSchema,
    ) {}

    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Paginated batch listing with filters.
     *
     * Supported filters (all optional):
     *   - product_id      (int)
     *   - variant_id      (int)
     *   - status          (string: active | depleted | expired)
     *   - expiry_warning  (bool: batches expiring within 30 days)
     *   - per_page        (int: default 20, max 50)
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Batch::with(['product', 'variant', 'supplier'])
            ->orderBy('received_at', 'desc');

        if (! empty($filters['product_id'])) {
            $query->where('product_id', (int) $filters['product_id']);
        }

        if (! empty($filters['variant_id'])) {
            $query->where('variant_id', (int) $filters['variant_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['expiry_warning'])) {
            // Batches whose expiry_date attribute is within the next 30 days
            $cutoff = now()->addDays(30)->toDateString();
            $today  = now()->toDateString();
            $query->whereRaw(
                "(attributes->>'expiry_date') IS NOT NULL
                 AND (attributes->>'expiry_date')::date BETWEEN ?::date AND ?::date",
                [$today, $cutoff],
            );
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->paginate($perPage);
    }

    /**
     * Find a single batch with all relations.
     */
    public function find(int $id): Batch
    {
        return Batch::with(['product.category', 'variant', 'supplier', 'movements'])
            ->findOrFail($id);
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    /**
     * Create a new batch.
     *
     * Validates `attributes` against the product's category batch-level fields.
     * Auto-generates batch_number if not provided.
     */
    public function create(array $data): Batch
    {
        $product = Product::with('category')->findOrFail($data['product_id']);

        $this->validateBatchAttributes($product, $data['attributes'] ?? []);

        $data['batch_number'] ??= $this->generateBatchNumber();
        $data['received_at']  ??= now();
        $data['attributes']   ??= [];

        // initial_quantity and current_quantity start the same
        $data['current_quantity'] = $data['initial_quantity'];

        return Batch::create($data);
    }

    /**
     * Update batch metadata (not quantity — quantity is managed via movements).
     */
    public function update(Batch $batch, array $data): Batch
    {
        // If attributes are being updated, re-validate against category schema
        if (isset($data['attributes'])) {
            $product = $batch->product()->with('category')->first();
            $this->validateBatchAttributes($product, $data['attributes']);
        }

        // Disallow direct quantity changes via update — use StockMovementService
        unset($data['initial_quantity'], $data['current_quantity']);

        $batch->update($data);

        return $batch->fresh(['product', 'variant', 'supplier']);
    }

    /**
     * Mark a batch as expired.
     */
    public function markExpired(Batch $batch): Batch
    {
        $batch->update(['status' => 'expired']);

        return $batch->fresh();
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Validate batch attributes against the product category's batch-level schema.
     */
    private function validateBatchAttributes(Product $product, array $attributes): void
    {
        $batchFields = $product->category->getBatchFields()->map->toArray()->all();

        if (! empty($batchFields)) {
            $this->fieldSchema->validateAttributes($attributes, $batchFields);
        }
    }

    /**
     * Generate a unique batch number (LOT-YYYYMMDD-XXXX).
     */
    private function generateBatchNumber(): string
    {
        $date = now()->format('Ymd');

        do {
            $number = 'LOT-' . $date . '-' . strtoupper(Str::random(4));
        } while (Batch::where('batch_number', $number)->exists());

        return $number;
    }
}
