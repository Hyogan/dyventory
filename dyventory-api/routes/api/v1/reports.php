<?php

declare(strict_types=1);

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {

    // ── Dashboard ─────────────────────────────────────────────────────────────
    Route::get('/dashboard', [DashboardController::class, 'stats']);

    // ── Sales Reports ─────────────────────────────────────────────────────────
    Route::prefix('reports/sales')->name('reports.sales.')->group(function (): void {
        Route::get('/summary',        [ReportController::class, 'salesSummary']);
        Route::get('/by-period',      [ReportController::class, 'salesByPeriod']);
        Route::get('/by-vendor',      [ReportController::class, 'salesByVendor']);
        Route::get('/by-category',    [ReportController::class, 'salesByCategory']);
        Route::get('/by-client',      [ReportController::class, 'salesByClient']);
        Route::get('/by-payment',     [ReportController::class, 'salesByPaymentMethod']);
    });

    // ── Stock Reports ─────────────────────────────────────────────────────────
    Route::prefix('reports/stock')->name('reports.stock.')->group(function (): void {
        Route::get('/value-by-category', [ReportController::class, 'stockValueByCategory']);
        Route::get('/losses',            [ReportController::class, 'stockLosses']);
        Route::get('/dormant',           [ReportController::class, 'dormantProducts']);
        Route::get('/rotation',          [ReportController::class, 'stockRotation']);
        Route::get('/forecast',          [ReportController::class, 'stockForecast']);
    });

    // ── TVA Reports ───────────────────────────────────────────────────────────
    Route::prefix('reports/tva')->name('reports.tva.')->group(function (): void {
        Route::get('/summary',   [ReportController::class, 'tvaSummary']);
        Route::get('/by-period', [ReportController::class, 'tvaByPeriod']);
        Route::get('/by-rate',   [ReportController::class, 'tvaByRate']);
    });

    // ── Credit Reports ────────────────────────────────────────────────────────
    Route::prefix('reports/credit')->name('reports.credit.')->group(function (): void {
        Route::get('/summary',    [ReportController::class, 'creditSummary']);
        Route::get('/by-client',  [ReportController::class, 'outstandingByClient']);
        Route::get('/overdue',    [ReportController::class, 'overdueInvoices']);
        Route::get('/collected',  [ReportController::class, 'collectedByPeriod']);
    });

    // ── Exports ───────────────────────────────────────────────────────────────
    Route::prefix('reports/export')->name('reports.export.')->group(function (): void {
        Route::get('/sales',          [ReportController::class, 'exportSales']);
        Route::get('/stock-forecast', [ReportController::class, 'exportStockForecast']);
        Route::get('/tva',            [ReportController::class, 'exportTva']);
    });

});
