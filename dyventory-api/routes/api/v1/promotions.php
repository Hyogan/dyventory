<?php

declare(strict_types=1);

use App\Http\Controllers\Api\PromotionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/promotions/active', [PromotionController::class, 'active']);
    Route::apiResource('promotions', PromotionController::class);
});
