<?php

use App\Jobs\CheckOverdueCredits;
use App\Jobs\CheckStockAlerts;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Stock Alert Checks — run daily at 06:00
|--------------------------------------------------------------------------
|
| CheckStockAlerts evaluates low stock, zero stock, batch expiry, and
| mortality risk for living products (e.g. snails).  It writes to the
| notifications table; the frontend Alert Centre polls this.
|
*/
Schedule::job(new CheckStockAlerts)
    ->dailyAt('06:00')
    ->name('stock:check-alerts')
    ->withoutOverlapping()
    ->onOneServer();

/*
|--------------------------------------------------------------------------
| Overdue Credit Check — run daily at 07:00
|--------------------------------------------------------------------------
|
| CheckOverdueCredits marks credit sales whose due_date has passed
| and are still pending or partially paid as 'overdue'.
|
*/
Schedule::job(new CheckOverdueCredits)
    ->dailyAt('07:00')
    ->name('sales:check-overdue-credits')
    ->withoutOverlapping()
    ->onOneServer();
