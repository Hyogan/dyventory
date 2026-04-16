<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MovementType;
use App\Enums\SupplierOrderStatus;
use App\Models\Batch;
use App\Models\SupplierOrder;
use App\Models\SupplierOrderItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Supplier order lifecycle engine.
 *
 * Lifecycle:  draft → sent → confirmed → partially_received|received → (closed)
 *             draft → cancelled   OR   sent → cancelled
 *
 * Receiving stock:
 *   For each received order item:
 *    1. Create a new Batch (current_quantity=0, initial_quantity=qty)
 *    2. Record an in_purchase StockMovement via StockMovementService
 *       (which increments batch.current_quantity to qty)
 *
 * This guarantees both a live stock level AND a full audit trail.
 */
class SupplierOrderService
{
    public function __construct(
        private readonly StockMovementService $stock,
    ) {}

    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Paginated orders for a given supplier.
     *
     * Filters (all optional): status, per_page
     */
    public function list(int $supplierId, array $filters = []): LengthAwarePaginator
    {
        $query = SupplierOrder::with(['user', 'items.product', 'items.variant'])
            ->where('supplier_id', $supplierId)
            ->orderBy('created_at', 'desc');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->paginate($perPage);
    }

    public function find(int $id): SupplierOrder
    {
        return SupplierOrder::with(['supplier', 'user', 'items.product', 'items.variant'])
            ->findOrFail($id);
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    /**
     * Create a new draft supplier order with line items.
     *
     * @param array{
     *   supplier_id: int,
     *   expected_at?: string|null,
     *   notes?: string|null,
     *   items: array<array{
     *     product_id: int,
     *     variant_id?: int|null,
     *     quantity_ordered: float|string,
     *     unit_price_ht: float|string,
     *   }>
     * } $data
     */
    public function create(array $data, int $userId): SupplierOrder
    {
        return DB::transaction(function () use ($data, $userId): SupplierOrder {
            $totalAmount = array_sum(array_map(
                static fn ($item) => (float) $item['quantity_ordered'] * (float) $item['unit_price_ht'],
                $data['items'],
            ));

            $order = SupplierOrder::create([
                'supplier_id'  => $data['supplier_id'],
                'user_id'      => $userId,
                'order_number' => $this->generateOrderNumber(),
                'status'       => SupplierOrderStatus::Draft->value,
                'total_amount' => round($totalAmount, 2),
                'expected_at'  => $data['expected_at'] ?? null,
                'notes'        => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $order->items()->create([
                    'product_id'        => $item['product_id'],
                    'variant_id'        => $item['variant_id'] ?? null,
                    'quantity_ordered'  => (float) $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_price_ht'     => (float) $item['unit_price_ht'],
                ]);
            }

            return $this->find($order->id);
        });
    }

    /**
     * Update line items on a draft order (replace all items).
     */
    public function update(SupplierOrder $order, array $data): SupplierOrder
    {
        $this->assertStatus($order, [SupplierOrderStatus::Draft], 'Only draft orders can be edited.');

        return DB::transaction(function () use ($order, $data): SupplierOrder {
            if (isset($data['items'])) {
                $order->items()->delete();

                $totalAmount = 0;

                foreach ($data['items'] as $item) {
                    $order->items()->create([
                        'product_id'        => $item['product_id'],
                        'variant_id'        => $item['variant_id'] ?? null,
                        'quantity_ordered'  => (float) $item['quantity_ordered'],
                        'quantity_received' => 0,
                        'unit_price_ht'     => (float) $item['unit_price_ht'],
                    ]);

                    $totalAmount += (float) $item['quantity_ordered'] * (float) $item['unit_price_ht'];
                }

                $data['total_amount'] = round($totalAmount, 2);
            }

            unset($data['items'], $data['supplier_id']); // supplier and items handled above
            $order->update($data);

            return $this->find($order->id);
        });
    }

    /** draft → sent */
    public function send(SupplierOrder $order): SupplierOrder
    {
        $this->assertStatus($order, [SupplierOrderStatus::Draft], 'Only draft orders can be sent.');

        $order->update(['status' => SupplierOrderStatus::Sent->value]);

        return $order->refresh();
    }

    /** sent → confirmed */
    public function confirm(SupplierOrder $order): SupplierOrder
    {
        $this->assertStatus($order, [SupplierOrderStatus::Sent], 'Only sent orders can be confirmed.');

        $order->update(['status' => SupplierOrderStatus::Confirmed->value]);

        return $order->refresh();
    }

    /** draft|sent → cancelled */
    public function cancel(SupplierOrder $order): SupplierOrder
    {
        $this->assertStatus(
            $order,
            [SupplierOrderStatus::Draft, SupplierOrderStatus::Sent],
            'Only draft or sent orders can be cancelled.',
        );

        $order->update(['status' => SupplierOrderStatus::Cancelled->value]);

        return $order->refresh();
    }

    /**
     * Receive stock from a confirmed or partially-received order.
     *
     * For each item in the payload:
     *  1. Creates a new Batch with current_quantity=0
     *  2. Records an in_purchase stock movement (increments batch.current_quantity)
     *  3. Increments quantity_received on the SupplierOrderItem
     *
     * Recomputes order status after all items are processed.
     *
     * @param array{
     *   items: array<array{
     *     order_item_id: int,
     *     quantity_received: float|string,
     *     batch_number?: string|null,
     *     expiry_date?: string|null,
     *     custom_attributes?: array<string, mixed>,
     *   }>
     * } $data
     */
    public function receive(SupplierOrder $order, array $data, int $userId): SupplierOrder
    {
        $this->assertStatus(
            $order,
            [SupplierOrderStatus::Confirmed, SupplierOrderStatus::PartiallyReceived],
            'Only confirmed or partially-received orders can receive stock.',
        );

        return DB::transaction(function () use ($order, $data, $userId): SupplierOrder {
            foreach ($data['items'] as $item) {
                $orderItem = SupplierOrderItem::where('id', $item['order_item_id'])
                    ->where('supplier_order_id', $order->id)
                    ->firstOrFail();

                $qty = (float) $item['quantity_received'];

                if ($qty <= 0) {
                    continue;
                }

                // Validate we're not receiving more than what remains
                $remaining = (float) $orderItem->quantity_ordered - (float) $orderItem->quantity_received;
                if ($qty > $remaining + 0.001) {
                    throw ValidationException::withMessages([
                        "items.{$item['order_item_id']}" => [
                            "Cannot receive {$qty} — only {$remaining} units remain for this item.",
                        ],
                    ]);
                }

                // Build batch attributes — dynamic fields + expiry
                $attributes = array_filter(
                    array_merge(
                        ['expiry_date' => $item['expiry_date'] ?? null],
                        (array) ($item['custom_attributes'] ?? []),
                    ),
                    static fn ($v) => $v !== null,
                );

                // Create batch with current_quantity=0 (will be set by recordEntry)
                $batch = Batch::create([
                    'product_id'       => $orderItem->product_id,
                    'variant_id'       => $orderItem->variant_id,
                    'supplier_id'      => $order->supplier_id,
                    'batch_number'     => $item['batch_number'] ?? null,
                    'initial_quantity' => $qty,
                    'current_quantity' => 0,
                    'received_at'      => now(),
                    'status'           => 'active',
                    'attributes'       => $attributes ?: null,
                ]);

                // Record stock entry — increments batch.current_quantity to $qty
                $this->stock->recordEntry([
                    'product_id'     => $orderItem->product_id,
                    'variant_id'     => $orderItem->variant_id,
                    'batch_id'       => $batch->id,
                    'quantity'       => $qty,
                    'type'           => MovementType::InPurchase->value,
                    'user_id'        => $userId,
                    'reference_id'   => $order->id,
                    'reference_type' => SupplierOrder::class,
                    'notes'          => "Received from PO {$order->order_number}",
                ]);

                // Increment quantity_received on the order item
                $orderItem->increment('quantity_received', $qty);
            }

            // Recompute order completion status
            $order->load('items');
            $newStatus = $this->computeReceiptStatus($order);
            $update    = ['status' => $newStatus->value];

            if ($newStatus === SupplierOrderStatus::Received) {
                $update['received_at'] = now();
            }

            $order->update($update);

            return $this->find($order->id);
        });
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /** @param SupplierOrderStatus[] $allowed */
    private function assertStatus(SupplierOrder $order, array $allowed, string $message): void
    {
        if (! in_array($order->status, $allowed, true)) {
            throw ValidationException::withMessages(['status' => [$message]]);
        }
    }

    private function computeReceiptStatus(SupplierOrder $order): SupplierOrderStatus
    {
        $allFull = $order->items->every(
            static fn (SupplierOrderItem $item) =>
                (float) $item->quantity_received >= (float) $item->quantity_ordered - 0.001
        );

        return $allFull ? SupplierOrderStatus::Received : SupplierOrderStatus::PartiallyReceived;
    }

    /**
     * Generate the next sequential purchase order number for the current year.
     * Uses a DB lock to prevent duplicates under concurrent requests.
     */
    private function generateOrderNumber(): string
    {
        $year   = now()->year;
        $prefix = "PO-{$year}-";

        $last = SupplierOrder::withTrashed()
            ->where('order_number', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->lockForUpdate()
            ->value('order_number');

        $seq = $last
            ? (int) substr($last, strlen($prefix)) + 1
            : 1;

        return $prefix . str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }
}
