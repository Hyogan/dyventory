<?php

declare(strict_types=1);

use App\Http\Controllers\Api\BatchController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\StockMovementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Stock Routes  —  /api/v1/stock/*  and  /api/v1/batches/*
|--------------------------------------------------------------------------
|
| All routes are protected via auth:sanctum in each controller's middleware().
|
| Batches:
| GET    /api/v1/batches                                index
| POST   /api/v1/batches                                store
| GET    /api/v1/batches/{batch}                        show
| PUT    /api/v1/batches/{batch}                        update
| POST   /api/v1/batches/{batch}/expire                 expire
|
| Stock Movements (history):
| GET    /api/v1/stock/movements                        index   (?product_id, ?batch_id, ?type, ?user_id, ?date_from, ?date_to)
| GET    /api/v1/stock/movements/{movement}             show
|
| Stock Operations:
| POST   /api/v1/stock/entry                            entry    (in_purchase | in_return — requires batch_id)
| POST   /api/v1/stock/exit                             exit     (out_sale | out_loss | out_expiry | out_mortality — FEFO if no batch_id)
| POST   /api/v1/stock/adjustment                       adjustment (set absolute quantity on a batch)
|
| Inventory Sessions:
| POST   /api/v1/stock/inventory/start                  start
| GET    /api/v1/stock/inventory/{session}              show
| POST   /api/v1/stock/inventory/{session}/counts       submitCounts
| GET    /api/v1/stock/inventory/{session}/discrepancies discrepancies (preview)
| POST   /api/v1/stock/inventory/{session}/validate     validate (apply adjustments + complete)
| POST   /api/v1/stock/inventory/{session}/cancel       cancel
|
*/

// ─────────────────────────────────────────────
// Batches
// ─────────────────────────────────────────────

Route::apiResource('batches', BatchController::class)->only(['index', 'store', 'show', 'update']);

Route::post('batches/{batch}/expire', [BatchController::class, 'expire'])
    ->name('batches.expire');

// ─────────────────────────────────────────────
// Stock Movements (read + record)
// ─────────────────────────────────────────────

Route::get('stock/movements', [StockMovementController::class, 'index'])
    ->name('stock.movements.index');

Route::get('stock/movements/{movement}', [StockMovementController::class, 'show'])
    ->name('stock.movements.show');

Route::post('stock/entry', [StockMovementController::class, 'entry'])
    ->name('stock.entry');

Route::post('stock/exit', [StockMovementController::class, 'exit'])
    ->name('stock.exit');

Route::post('stock/adjustment', [StockMovementController::class, 'adjustment'])
    ->name('stock.adjustment');

// ─────────────────────────────────────────────
// Inventory Sessions
// ─────────────────────────────────────────────

Route::post('stock/inventory/start', [InventoryController::class, 'start'])
    ->name('stock.inventory.start');

Route::get('stock/inventory/{session}', [InventoryController::class, 'show'])
    ->name('stock.inventory.show');

Route::post('stock/inventory/{session}/counts', [InventoryController::class, 'submitCounts'])
    ->name('stock.inventory.counts');

Route::get('stock/inventory/{session}/discrepancies', [InventoryController::class, 'discrepancies'])
    ->name('stock.inventory.discrepancies');

Route::post('stock/inventory/{session}/validate', [InventoryController::class, 'validate'])
    ->name('stock.inventory.validate');

Route::post('stock/inventory/{session}/cancel', [InventoryController::class, 'cancel'])
    ->name('stock.inventory.cancel');
