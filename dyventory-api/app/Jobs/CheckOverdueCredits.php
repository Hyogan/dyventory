<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Marks credit sales as overdue when their due_date has passed
 * and they have not been fully paid.
 *
 * Scheduled daily — see routes/console.php.
 */
class CheckOverdueCredits implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $overdueCount = Sale::query()
            ->whereIn('status', [SaleStatus::Confirmed->value, SaleStatus::Delivered->value])
            ->whereIn('payment_status', [PaymentStatus::Pending->value, PaymentStatus::Partial->value])
            ->where('payment_method', 'credit')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->update(['payment_status' => PaymentStatus::Overdue->value]);

        if ($overdueCount > 0) {
            Log::info("CheckOverdueCredits: marked {$overdueCount} sale(s) as overdue.");
        }
    }
}
