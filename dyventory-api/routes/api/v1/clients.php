<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ClientController;
use Illuminate\Support\Facades\Route;

Route::prefix('clients')->group(static function (): void {
    Route::get('/',                    [ClientController::class, 'index']);
    Route::post('/',                   [ClientController::class, 'store']);
    Route::get('/search',              [ClientController::class, 'search']);
    Route::get('/{client}',            [ClientController::class, 'show']);
    Route::get('/{client}/summary',    [ClientController::class, 'summary']);
    Route::put('/{client}',            [ClientController::class, 'update']);
    Route::delete('/{client}',         [ClientController::class, 'destroy']);
});
