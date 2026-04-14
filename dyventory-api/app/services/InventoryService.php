<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Batch;
use App\Models\InventorySession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Inventory session flow:
 *
 * 1. start()         — snapshots current stock levels (product → batch quantities)
 * 2. submitCounts()  — stores user-submitted physical counts
 * 3. computeDiscrepancies() — returns delta: counted vs snapshot (never persists)
 * 4. validate()      — finalises: creates adjustment movements for discrepancies,
 *                      marks session completed
 *
 * Only one in_progress session per user at a time.
 */
class InventoryService
{
    public function __construct(
        private readonly StockMovementService $stockMovements,
    ) {}

    // ─────────────────────────────────────────────
    // 1. Start a session
    // ─────────────────────────────────────────────

    /**
     * Begin a new inventory session for the given user.
     *
     * Snapshot format:
     * {
     *   "batch_{id}": {
     *     "batch_id": 1,
     *     "product_id": 5,
     *     "product_name": "...",
     *     "batch_number": "LOT-...",
     *     "quantity": 12.500
     *   },
     *   ...
     * }
     *
     * @throws ValidationException if user already has an in_progress session
     */
    public function start(User $user): InventorySession
    {
        $existing = InventorySession::where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'session' => ['You already have an inventory session in progress (ID: ' . $existing->id . ').'],
            ]);
        }

        $snapshot = $this->buildSnapshot();

        return InventorySession::create([
            'user_id'  => $user->id,
            'status'   => 'in_progress',
            'snapshot' => $snapshot,
            'counts'   => [],
        ]);
    }

    // ─────────────────────────────────────────────
    // 2. Submit counts
    // ─────────────────────────────────────────────

    /**
     * Store the user's physical count for each batch.
     *
     * Counts format (array of items):
     * [
     *   { "batch_id": 1, "counted_quantity": 11.000 },
     *   { "batch_id": 2, "counted_quantity": 0.000 },
     * ]
     *
     * Converts to keyed array and stores on session.counts.
     *
     * @param  array<int, array{batch_id: int, counted_quantity: float|string}>  $counts
     */
    public function submitCounts(InventorySession $session, array $counts): InventorySession
    {
        $this->assertInProgress($session);

        $keyed = [];
        foreach ($counts as $item) {
            $key         = 'batch_' . $item['batch_id'];
            $keyed[$key] = [
                'batch_id'          => (int) $item['batch_id'],
                'counted_quantity'  => (float) $item['counted_quantity'],
            ];
        }

        $session->update(['counts' => $keyed]);

        return $session->fresh();
    }

    // ─────────────────────────────────────────────
    // 3. Compute discrepancies (read-only)
    // ─────────────────────────────────────────────

    /**
     * Compute discrepancies between snapshot quantities and submitted counts.
     *
     * Returns an array of discrepancy items — only those where delta ≠ 0.
     *
     * @return array<int, array{batch_id: int, product_id: int, product_name: string, batch_number: string, snapshot_quantity: float, counted_quantity: float, delta: float}>
     */
    public function computeDiscrepancies(InventorySession $session): array
    {
        $snapshot = $session->snapshot ?? [];
        $counts   = $session->counts   ?? [];

        $discrepancies = [];

        foreach ($snapshot as $key => $snap) {
            $snapQty = (float) $snap['quantity'];
            $counted = (float) ($counts[$key]['counted_quantity'] ?? $snapQty);
            $delta   = round($counted - $snapQty, 3);

            if ($delta !== 0.0) {
                $discrepancies[] = [
                    'batch_id'          => $snap['batch_id'],
                    'product_id'        => $snap['product_id'],
                    'product_name'      => $snap['product_name'],
                    'batch_number'      => $snap['batch_number'],
                    'snapshot_quantity' => $snapQty,
                    'counted_quantity'  => $counted,
                    'delta'             => $delta,
                ];
            }
        }

        return $discrepancies;
    }

    // ─────────────────────────────────────────────
    // 4. Validate and apply adjustments
    // ─────────────────────────────────────────────

    /**
     * Finalise the session:
     * - Computes discrepancies
     * - Creates an Adjustment StockMovement for each discrepant batch
     * - Stores discrepancy report on the session
     * - Marks session as completed
     */
    public function validate(InventorySession $session): InventorySession
    {
        $this->assertInProgress($session);

        $discrepancies = $this->computeDiscrepancies($session);

        DB::transaction(function () use ($session, $discrepancies): void {
            foreach ($discrepancies as $item) {
                $batch      = Batch::findOrFail($item['batch_id']);
                $newQty     = $item['counted_quantity'];

                $this->stockMovements->recordAdjustment([
                    'product_id'     => $item['product_id'],
                    'batch_id'       => $batch->id,
                    'quantity'       => $newQty,
                    'user_id'        => $session->user_id,
                    'notes'          => 'Inventory session #' . $session->id,
                    'reference_id'   => $session->id,
                    'reference_type' => InventorySession::class,
                ]);
            }

            $session->update([
                'status'        => 'completed',
                'discrepancies' => $discrepancies,
                'completed_at'  => now(),
            ]);
        });

        return $session->fresh();
    }

    /**
     * Cancel an in-progress session without applying any adjustments.
     */
    public function cancel(InventorySession $session): InventorySession
    {
        $this->assertInProgress($session);

        $session->update(['status' => 'cancelled']);

        return $session->fresh();
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Build a snapshot of all active batch quantities.
     *
     * @return array<string, array{batch_id: int, product_id: int, product_name: string, batch_number: string, quantity: float}>
     */
    private function buildSnapshot(): array
    {
        $batches = Batch::active()
            ->with('product:id,name')
            ->get(['id', 'product_id', 'batch_number', 'current_quantity']);

        $snapshot = [];

        foreach ($batches as $batch) {
            $key             = 'batch_' . $batch->id;
            $snapshot[$key]  = [
                'batch_id'     => $batch->id,
                'product_id'   => $batch->product_id,
                'product_name' => $batch->product->name,
                'batch_number' => $batch->batch_number ?? "#{$batch->id}",
                'quantity'     => (float) $batch->current_quantity,
            ];
        }

        return $snapshot;
    }

    private function assertInProgress(InventorySession $session): void
    {
        if (! $session->isInProgress()) {
            throw ValidationException::withMessages([
                'session' => ['This inventory session is no longer in progress (status: ' . $session->status . ').'],
            ]);
        }
    }
}
