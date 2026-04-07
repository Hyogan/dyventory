<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes  —  /api/v1/auth/*
|--------------------------------------------------------------------------
|
| These routes are loaded by bootstrap/app.php under the /api/v1 prefix
| with the 'api' middleware group already applied.
|
| Public:    POST /api/v1/auth/login    (rate-limited: 10 per minute)
| Protected: POST /api/v1/auth/logout
|            GET  /api/v1/auth/me
|
| Note: auth:sanctum is applied per-method via the #[Middleware] attribute
| on AuthController — no need to wrap protected routes here.
|
*/

Route::post('/auth/login', [AuthController::class, 'login'])
    ->name('auth.login')
    ->middleware('throttle:10,1');   // 10 attempts per 1-minute window

Route::post('/auth/logout', [AuthController::class, 'logout'])
    ->name('auth.logout');

Route::get('/auth/me', [AuthController::class, 'me'])
    ->name('auth.me');
