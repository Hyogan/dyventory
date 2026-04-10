<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\BarcodeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Product Routes  —  /api/v1/products/*
|--------------------------------------------------------------------------
|
| All routes are protected via auth:sanctum in each controller's middleware().
| Authorization is handled via ProductPolicy (Gate::policy in AppServiceProvider).
|
| GET    /api/v1/products                          index   (?category_id, ?status, ?search, ?low_stock, ?per_page)
| POST   /api/v1/products                          store
| GET    /api/v1/products/{product}                show
| PUT    /api/v1/products/{product}                update
| DELETE /api/v1/products/{product}                destroy
| POST   /api/v1/products/{product}/archive        archive
| POST   /api/v1/products/{product}/restore        restore
| POST   /api/v1/products/{product}/images         uploadImage
|
| Variants (nested):
| GET    /api/v1/products/{product}/variants                index
| POST   /api/v1/products/{product}/variants                store
| GET    /api/v1/products/{product}/variants/{variant}      show
| PUT    /api/v1/products/{product}/variants/{variant}      update
| DELETE /api/v1/products/{product}/variants/{variant}      destroy
|
| Barcodes:
| GET    /api/v1/products/{product}/barcode                 barcode SVG
| GET    /api/v1/products/{product}/label-sheet              label sheet PDF
|
*/

Route::apiResource('products', ProductController::class);

Route::post('products/{product}/archive', [ProductController::class, 'archive'])
    ->name('products.archive');

Route::post('products/{product}/restore', [ProductController::class, 'restore'])
    ->name('products.restore');

Route::post('products/{product}/images', [ProductController::class, 'uploadImage'])
    ->name('products.images.upload');

// Nested variant routes
Route::apiResource('products.variants', ProductVariantController::class)
    ->shallow();

// Barcode endpoints
Route::get('products/{product}/barcode', [BarcodeController::class, 'show'])
    ->name('products.barcode');

Route::get('products/{product}/label-sheet', [BarcodeController::class, 'labelSheet'])
    ->name('products.label-sheet');
