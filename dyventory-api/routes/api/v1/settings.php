<?php

declare(strict_types=1);

use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\VatRateController;
use Illuminate\Support\Facades\Route;

// ── Company settings (admin-only) ─────────────────────────────────────────────
Route::prefix('settings')->group(static function (): void {
    Route::get('/',         [SettingController::class, 'index']);
    Route::put('/',         [SettingController::class, 'update']);
    Route::post('/logo',    [SettingController::class, 'uploadLogo']);
});

// ── VAT rates (read: any authenticated; write: admin only) ───────────────────
Route::prefix('vat-rates')->group(static function (): void {
    Route::get('/',              [VatRateController::class, 'index']);
    Route::post('/',             [VatRateController::class, 'store']);
    Route::get('/{vatRate}',     [VatRateController::class, 'show']);
    Route::put('/{vatRate}',     [VatRateController::class, 'update']);
    Route::delete('/{vatRate}',  [VatRateController::class, 'destroy']);
});
