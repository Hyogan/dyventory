<?php

declare(strict_types=1);

use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierOrderController;
use Illuminate\Support\Facades\Route;

// ── Supplier CRUD + search ────────────────────────────────────────────────────
Route::prefix('suppliers')->group(static function (): void {
    Route::get('/',                      [SupplierController::class, 'index']);
    Route::post('/',                     [SupplierController::class, 'store']);
    Route::get('/search',                [SupplierController::class, 'search']);
    Route::get('/{supplier}',            [SupplierController::class, 'show']);
    Route::get('/{supplier}/summary',    [SupplierController::class, 'summary']);
    Route::put('/{supplier}',            [SupplierController::class, 'update']);
    Route::delete('/{supplier}',         [SupplierController::class, 'destroy']);

    // Orders nested under a supplier
    Route::get('/{supplier}/orders',     [SupplierOrderController::class, 'index']);
    Route::post('/{supplier}/orders',    [SupplierOrderController::class, 'store']);
});

// ── Supplier order lifecycle (standalone) ────────────────────────────────────
Route::prefix('supplier-orders')->group(static function (): void {
    Route::get('/{supplierOrder}',           [SupplierOrderController::class, 'show']);
    Route::put('/{supplierOrder}',           [SupplierOrderController::class, 'update']);
    Route::post('/{supplierOrder}/send',     [SupplierOrderController::class, 'send']);
    Route::post('/{supplierOrder}/confirm',  [SupplierOrderController::class, 'confirm']);
    Route::post('/{supplierOrder}/cancel',   [SupplierOrderController::class, 'cancel']);
    Route::post('/{supplierOrder}/receive',  [SupplierOrderController::class, 'receive']);
});
