<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MovementType;
use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use App\Events\SaleConfirmed;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Core sale transaction engine.
 *
 * Responsibilities:
 *  - Generate sale numbers (INV-YYYY-#####)
 *  - Compute HT / TVA / TTC from product prices + VAT rates
 *  - Apply per-item discount_percent and global discount_amount
 *  - Decrement stock via StockMovementService (FEFO) on confirmation
 *  - Record partial payments and recompute payment_status
 *  - Fire SaleConfirmed event after a successful confirmation
 */
class SaleService
{
    public function __construct(
        private readonly StockMovementService $stock,
    ) {}

    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Paginated sale listing.
     *
     * Filters (all optional):
     *   status, payment_status, client_id, date_from, date_to, search (sale_number), per_page
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Sale::with(['client', 'user'])
            ->orderBy('created_at', 'desc');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (! empty($filters['client_id'])) {
            $query->where('client_id', (int) $filters['client_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['search'])) {
            $query->where('sale_number', 'ilike', '%' . $filters['search'] . '%');
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->paginate($perPage);
    }

    public function find(int $id): Sale
    {
        return Sale::with([
            'client',
            'user',
            'items.product',
            'items.variant',
            'items.batch',
            'payments',
            'returns',
        ])->findOrFail($id);
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    /**
     * Create a new sale (draft or confirmed).
     *
     * @param array{
     *   client_id?: int|null,
     *   payment_method?: string|null,
     *   due_date?: string|null,
     *   discount_amount?: float|null,
     *   notes?: string|null,
     *   status?: string,
     *   items: array<array{
     *     product_id: int,
     *     variant_id?: int|null,
     *     quantity: float|string,
     *     discount_percent?: float|null,
     *   }>
     * } $data
     */
    public function create(array $data, int $userId): Sale
    {
        return DB::transaction(function () use ($data, $userId): Sale {
            $status         = SaleStatus::from($data['status'] ?? SaleStatus::Draft->value);
            $globalDiscount = (float) ($data['discount_amount'] ?? 0);

            $lines  = $this->calculateLines($data['items']);
            $totals = $this->computeTotals($lines, $globalDiscount);

            [$amountPaid, $paymentStatus] = $this->resolveInitialPaymentStatus(
                $status,
                $data['payment_method'] ?? null,
                $totals['total_ttc'],
            );

            $sale = Sale::create([
                'client_id'       => $data['client_id'] ?? null,
                'user_id'         => $userId,
                'sale_number'     => $this->generateSaleNumber(),
                'status'          => $status->value,
                'payment_status'  => $paymentStatus->value,
                'payment_method'  => $data['payment_method'] ?? null,
                'subtotal_ht'     => $totals['subtotal_ht'],
                'total_vat'       => $totals['total_vat'],
                'total_ttc'       => $totals['total_ttc'],
                'discount_amount' => $globalDiscount,
                'amount_paid'     => $amountPaid,
                'amount_due'      => round($totals['total_ttc'] - $amountPaid, 2),
                'due_date'        => $data['due_date'] ?? null,
                'notes'           => $data['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $sale->items()->create([
                    'product_id'      => $line['product_id'],
                    'variant_id'      => $line['variant_id'],
                    'quantity'        => $line['quantity'],
                    'unit_price_ht'   => $line['unit_price_ht'],
                    'unit_price_ttc'  => $line['unit_price_ttc'],
                    'vat_rate'        => $line['vat_rate'],
                    'discount_percent' => $line['discount_percent'],
                    'line_total_ttc'  => $line['line_total_ttc'],
                ]);
            }

            if ($status === SaleStatus::Confirmed) {
                $this->decrementStock($sale, $lines, $userId);
                SaleConfirmed::dispatch($sale->refresh());
            }

            return $this->find($sale->id);
        });
    }

    /**
     * Transition a draft sale to confirmed — decrement stock.
     */
    public function confirm(Sale $sale, int $userId): Sale
    {
        if ($sale->status !== SaleStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => ['Only draft sales can be confirmed.'],
            ]);
        }

        return DB::transaction(function () use ($sale, $userId): Sale {
            $lines = $sale->items->map(fn ($item) => [
                'product_id'      => $item->product_id,
                'variant_id'      => $item->variant_id,
                'quantity'        => (float) $item->quantity,
                'unit_price_ht'   => (float) $item->unit_price_ht,
                'unit_price_ttc'  => (float) $item->unit_price_ttc,
                'vat_rate'        => (float) $item->vat_rate,
                'discount_percent' => (float) $item->discount_percent,
                'line_total_ttc'  => (float) $item->line_total_ttc,
            ])->all();

            $this->decrementStock($sale, $lines, $userId);

            [$amountPaid, $paymentStatus] = $this->resolveInitialPaymentStatus(
                SaleStatus::Confirmed,
                $sale->payment_method,
                (float) $sale->total_ttc,
            );

            $sale->update([
                'status'         => SaleStatus::Confirmed->value,
                'payment_status' => $paymentStatus->value,
                'amount_paid'    => $amountPaid,
                'amount_due'     => round((float) $sale->total_ttc - $amountPaid, 2),
            ]);

            SaleConfirmed::dispatch($sale->refresh());

            return $this->find($sale->id);
        });
    }

    /**
     * Cancel a draft or confirmed sale.
     * Does NOT restore stock — use ReturnService for that.
     */
    public function cancel(Sale $sale): Sale
    {
        if (! $sale->status->canCancel()) {
            throw ValidationException::withMessages([
                'status' => ['This sale cannot be cancelled in its current state.'],
            ]);
        }

        $sale->update(['status' => SaleStatus::Cancelled->value]);

        return $sale->refresh();
    }

    /**
     * Deliver a confirmed sale.
     */
    public function markDelivered(Sale $sale): Sale
    {
        if ($sale->status !== SaleStatus::Confirmed) {
            throw ValidationException::withMessages([
                'status' => ['Only confirmed sales can be marked as delivered.'],
            ]);
        }

        $sale->update(['status' => SaleStatus::Delivered->value]);

        return $sale->refresh();
    }

    /**
     * Record a (partial) payment against a sale.
     *
     * @param array{
     *   amount: float|string,
     *   payment_method: string,
     *   reference?: string|null,
     *   notes?: string|null,
     *   paid_at?: string|null,
     * } $data
     */
    public function recordPayment(Sale $sale, array $data, int $userId): SalePayment
    {
        return DB::transaction(function () use ($sale, $data, $userId): SalePayment {
            $amount       = (float) $data['amount'];
            $newPaid      = round((float) $sale->amount_paid + $amount, 2);
            $totalTtc     = (float) $sale->total_ttc;

            if ($newPaid > $totalTtc + 0.01) { // 1-cent tolerance for float rounding
                throw ValidationException::withMessages([
                    'amount' => ['Payment amount exceeds the outstanding balance.'],
                ]);
            }

            $payment = SalePayment::create([
                'sale_id'        => $sale->id,
                'user_id'        => $userId,
                'amount'         => $amount,
                'payment_method' => $data['payment_method'],
                'reference'      => $data['reference'] ?? null,
                'notes'          => $data['notes'] ?? null,
                'paid_at'        => $data['paid_at'] ?? now()->toDateTimeString(),
            ]);

            $newDue           = round($totalTtc - $newPaid, 2);
            $newPaymentStatus = $newDue <= 0
                ? PaymentStatus::Paid
                : PaymentStatus::Partial;

            $sale->update([
                'amount_paid'    => $newPaid,
                'amount_due'     => max($newDue, 0),
                'payment_status' => $newPaymentStatus->value,
            ]);

            return $payment;
        });
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Compute per-line financials from raw item input.
     *
     * @param  array<array{product_id: int, variant_id?: int|null, quantity: float|string, discount_percent?: float|null}> $items
     * @return array<array{product_id: int, variant_id: int|null, quantity: float, unit_price_ht: float, unit_price_ttc: float, vat_rate: float, discount_percent: float, line_total_ht: float, line_total_ttc: float}>
     */
    private function calculateLines(array $items): array
    {
        $lines = [];

        foreach ($items as $item) {
            $product     = Product::with('vatRate')->findOrFail((int) $item['product_id']);
            $vatRate     = $product->vatRate ? (float) $product->vatRate->rate : 0.0;
            $qty         = (float) $item['quantity'];
            $discountPct = (float) ($item['discount_percent'] ?? 0);

            $unitPriceTtc           = (float) $product->price_sell_ttc;
            $unitPriceHt            = $vatRate > 0
                ? $unitPriceTtc / (1 + $vatRate / 100)
                : $unitPriceTtc;

            $lineTtcBeforeDiscount  = $unitPriceTtc * $qty;
            $lineDiscountAmount     = $lineTtcBeforeDiscount * ($discountPct / 100);
            $lineTotalTtc           = round($lineTtcBeforeDiscount - $lineDiscountAmount, 2);
            $lineTotalHt            = $vatRate > 0
                ? round($lineTotalTtc / (1 + $vatRate / 100), 2)
                : $lineTotalTtc;

            $lines[] = [
                'product_id'      => $product->id,
                'variant_id'      => $item['variant_id'] ?? null,
                'quantity'        => $qty,
                'unit_price_ht'   => round($unitPriceHt, 2),
                'unit_price_ttc'  => round($unitPriceTtc, 2),
                'vat_rate'        => $vatRate,
                'discount_percent' => $discountPct,
                'line_total_ht'   => $lineTotalHt,
                'line_total_ttc'  => $lineTotalTtc,
            ];
        }

        return $lines;
    }

    /**
     * Aggregate line totals and apply global sale-level discount.
     */
    private function computeTotals(array $lines, float $globalDiscount): array
    {
        $rawSubtotalHt = array_sum(array_column($lines, 'line_total_ht'));
        $rawTotalTtc   = array_sum(array_column($lines, 'line_total_ttc'));
        $rawTotalVat   = $rawTotalTtc - $rawSubtotalHt;

        if ($globalDiscount > 0 && $rawTotalTtc > 0) {
            $ratio         = ($rawTotalTtc - $globalDiscount) / $rawTotalTtc;
            $finalTotalTtc = round($rawTotalTtc - $globalDiscount, 2);
            $finalSubHt    = round($rawSubtotalHt * $ratio, 2);
            $finalVat      = round($finalTotalTtc - $finalSubHt, 2);
        } else {
            $finalTotalTtc = round($rawTotalTtc, 2);
            $finalSubHt    = round($rawSubtotalHt, 2);
            $finalVat      = round($rawTotalVat, 2);
        }

        return [
            'subtotal_ht' => $finalSubHt,
            'total_vat'   => $finalVat,
            'total_ttc'   => $finalTotalTtc,
        ];
    }

    /**
     * Determine initial amount_paid and payment_status based on payment method.
     *
     * credit → 0 / pending
     * cash / mobile_money / bank_transfer (confirmed) → full paid
     * draft (any method) → 0 / pending
     *
     * @return array{0: float, 1: PaymentStatus}
     */
    private function resolveInitialPaymentStatus(
        SaleStatus $status,
        ?string $paymentMethod,
        float $totalTtc,
    ): array {
        if ($status !== SaleStatus::Confirmed) {
            return [0.0, PaymentStatus::Pending];
        }

        return match ($paymentMethod) {
            'credit' => [0.0, PaymentStatus::Pending],
            default  => [$totalTtc, PaymentStatus::Paid],
        };
    }

    /**
     * Generate the next sequential sale number for the current year.
     * Uses a lock to prevent duplicate numbers under concurrency.
     */
    private function generateSaleNumber(): string
    {
        $year   = now()->year;
        $prefix = "INV-{$year}-";

        $last = Sale::withTrashed()
            ->where('sale_number', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->lockForUpdate()
            ->value('sale_number');

        $seq = $last
            ? (int) substr($last, strlen($prefix)) + 1
            : 1;

        return $prefix . str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Decrement stock for each sale line via FEFO exit movements.
     *
     * @param  array<array{product_id: int, variant_id: int|null, quantity: float, ...}> $lines
     */
    private function decrementStock(Sale $sale, array $lines, int $userId): void
    {
        foreach ($lines as $line) {
            $this->stock->recordExit([
                'product_id'     => $line['product_id'],
                'variant_id'     => $line['variant_id'] ?? null,
                'quantity'       => $line['quantity'],
                'type'           => MovementType::OutSale->value,
                'user_id'        => $userId,
                'reference_id'   => $sale->id,
                'reference_type' => Sale::class,
                'notes'          => "Sale {$sale->sale_number}",
            ]);
        }
    }
}
