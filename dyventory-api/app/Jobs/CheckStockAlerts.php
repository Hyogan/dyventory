<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\AlertService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Runs all stock alert checks.
 *
 * Dispatched daily via routes/console.php schedule.
 * Also dispatched inline after every stock movement via StockMovementRecorded event
 * listener (wired in EventServiceProvider or the model event).
 */
class CheckStockAlerts implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function handle(AlertService $alertService): void
    {
        $alertService->checkAll();
    }
}
