<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MovementType;
use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use App\Models\Batch;
use App\Models\Sale;
use App\Models\SaleReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Processes sale returns with optional stock restoration.
 *
 * Resolution types (from migration):
 *   refund       — money returned to client
 *   credit_note  — credit issued for future purchase
 *   exchange     — items swapped (no monetary refund)
 *
 * When restock = true, a stock entry (in_return) is recorded via
 * StockMovementService for each returned item.
 */
class ReturnService
{
    public function __construct(
        private readonly StockMovementService $stock,
    ) {}

    /**
     * Create a return for a sale.
     *
     * @param array{
     *   reason: string,
     *   resolution: string,
     *   refund_amount?: float|null,
     *   restock?: bool,
     *   notes?: string|null,
     *   items: array<array{
     *     product_id: int,
     *     quantity: float|string,
     *     batch_id?: int|null,
     *   }>
     * } $data
     */
    public function create(Sale $sale, array $data, int $userId): SaleReturn
    {
        $this->validateSaleEligible($sale);
        $this->validateReturnItems($sale, $data['items']);

        return DB::transaction(function () use ($sale, $data, $userId): SaleReturn {
            $restock      = (bool) ($data['restock'] ?? false);
            $refundAmount = (float) ($data['refund_amount'] ?? 0);

            $saleReturn = SaleReturn::create([
                'sale_id'       => $sale->id,
                'user_id'       => $userId,
                'reason'        => $data['reason'],
                'resolution'    => $data['resolution'],
                'refund_amount' => $refundAmount,
                'restock'       => $restock,
                'items'         => $data['items'],
                'notes'         => $data['notes'] ?? null,
            ]);

            if ($restock) {
                $this->restoreStock($sale, $data['items'], $userId, $saleReturn->id);
            }

            // Mark sale as returned
            $sale->update(['status' => SaleStatus::Returned->value]);

            // Adjust payment status if a refund is issued
            if ($refundAmount > 0 && $data['resolution'] === 'refund') {
                $sale->update(['payment_status' => PaymentStatus::Refunded->value]);
            }

            return $saleReturn->refresh();
        });
    }

    public function listForSale(Sale $sale): \Illuminate\Database\Eloquent\Collection
    {
        return $sale->returns()->orderBy('created_at', 'desc')->get();
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private function validateSaleEligible(Sale $sale): void
    {
        $eligible = [SaleStatus::Confirmed, SaleStatus::Delivered];

        if (! in_array($sale->status, $eligible, true)) {
            throw ValidationException::withMessages([
                'sale' => ['Only confirmed or delivered sales can be returned.'],
            ]);
        }
    }

    /**
     * Ensure returned items were actually part of the original sale
     * and that returned quantities don't exceed sold quantities.
     */
    private function validateReturnItems(Sale $sale, array $returnItems): void
    {
        $saleItemsByProduct = $sale->items->keyBy('product_id');

        foreach ($returnItems as $index => $item) {
            $productId = (int) $item['product_id'];

            if (! $saleItemsByProduct->has($productId)) {
                throw ValidationException::withMessages([
                    "items.{$index}.product_id" => ["Product #{$productId} was not part of this sale."],
                ]);
            }

            $saleItem    = $saleItemsByProduct->get($productId);
            $returnedQty = (float) $item['quantity'];
            $soldQty     = (float) $saleItem->quantity;

            if ($returnedQty > $soldQty) {
                throw ValidationException::withMessages([
                    "items.{$index}.quantity" => [
                        "Cannot return {$returnedQty} — only {$soldQty} was sold.",
                    ],
                ]);
            }
        }
    }

    /**
     * Restore stock for each returned item using in_return movement type.
     *
     * If a batch_id is provided it is used directly. Otherwise the service
     * picks the batch that was most recently depleted (best-effort).
     */
    private function restoreStock(Sale $sale, array $items, int $userId, int $returnId): void
    {
        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $qty       = (float) $item['quantity'];
            $batchId   = isset($item['batch_id']) ? (int) $item['batch_id'] : null;

            // Fall back to the most recently depleted batch for this product/sale
            if ($batchId === null) {
                $batchId = Batch::where('product_id', $productId)
                    ->orderByDesc('updated_at')
                    ->value('id');
            }

            if ($batchId === null) {
                // No batch available — skip stock restoration but log
                logger()->warning('ReturnService: no batch found for stock restoration', [
                    'product_id' => $productId,
                    'sale_id'    => $sale->id,
                ]);
                continue;
            }

            $this->stock->recordEntry([
                'product_id'     => $productId,
                'batch_id'       => $batchId,
                'quantity'       => $qty,
                'type'           => MovementType::InReturn->value,
                'user_id'        => $userId,
                'reference_id'   => $returnId,
                'reference_type' => SaleReturn::class,
                'notes'          => "Return for sale {$sale->sale_number}",
            ]);
        }
    }
}
