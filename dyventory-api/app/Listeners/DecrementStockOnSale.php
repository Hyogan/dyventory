<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\SaleConfirmed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Queued listener for post-sale-confirmation side effects.
 *
 * Stock is decremented synchronously inside SaleService::create/confirm
 * within the DB transaction. This listener handles async follow-up tasks
 * (audit logging, notifications, PDF queuing) that do not need to block
 * the HTTP response.
 */
class DecrementStockOnSale implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'default';

    public function handle(SaleConfirmed $event): void
    {
        $sale = $event->sale;

        Log::info('Sale confirmed — post-confirmation tasks running', [
            'sale_id'     => $sale->id,
            'sale_number' => $sale->sale_number,
            'total_ttc'   => $sale->total_ttc,
        ]);

        // Future: dispatch GenerateInvoicePdf::dispatch($sale)
        // Future: send confirmation email/notification to client
    }
}
