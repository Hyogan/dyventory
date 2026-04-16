<?php

declare(strict_types=1);

use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReturnController;
use App\Http\Controllers\Api\SaleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Sales Routes  —  /api/v1/sales/*
|--------------------------------------------------------------------------
|
| All routes are protected via auth:sanctum in each controller's middleware().
|
| Sales:
| GET    /api/v1/sales                          index  (?status, ?payment_status, ?client_id, ?date_from, ?date_to, ?search)
| POST   /api/v1/sales                          store  (create draft or confirmed sale)
| GET    /api/v1/sales/{sale}                   show
| POST   /api/v1/sales/{sale}/confirm           confirm  (draft → confirmed, decrements stock)
| POST   /api/v1/sales/{sale}/deliver           deliver  (confirmed → delivered)
| POST   /api/v1/sales/{sale}/cancel            cancel
|
| Payments (credit sales):
| GET    /api/v1/sales/{sale}/payments          index
| POST   /api/v1/sales/{sale}/payments          store
|
| Returns:
| GET    /api/v1/sales/{sale}/returns           index
| POST   /api/v1/sales/{sale}/returns           store
|
*/

// ─────────────────────────────────────────────
// Sales — core lifecycle
// ─────────────────────────────────────────────

Route::get('sales', [SaleController::class, 'index'])
    ->name('sales.index');

Route::post('sales', [SaleController::class, 'store'])
    ->name('sales.store');

Route::get('sales/{sale}', [SaleController::class, 'show'])
    ->name('sales.show');

Route::post('sales/{sale}/confirm', [SaleController::class, 'confirm'])
    ->name('sales.confirm');

Route::post('sales/{sale}/deliver', [SaleController::class, 'deliver'])
    ->name('sales.deliver');

Route::post('sales/{sale}/cancel', [SaleController::class, 'cancel'])
    ->name('sales.cancel');

// ─────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────

Route::get('sales/{sale}/payments', [PaymentController::class, 'index'])
    ->name('sales.payments.index');

Route::post('sales/{sale}/payments', [PaymentController::class, 'store'])
    ->name('sales.payments.store');

// ─────────────────────────────────────────────
// Returns
// ─────────────────────────────────────────────

Route::get('sales/{sale}/returns', [ReturnController::class, 'index'])
    ->name('sales.returns.index');

Route::post('sales/{sale}/returns', [ReturnController::class, 'store'])
    ->name('sales.returns.store');
