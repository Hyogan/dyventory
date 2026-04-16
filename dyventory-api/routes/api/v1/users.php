<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ── Users (admin-only) ────────────────────────────────────────────────────────
Route::prefix('users')->group(static function (): void {
    Route::get('/',                    [UserController::class, 'index']);
    Route::post('/',                   [UserController::class, 'store']);
    Route::get('/{user}',              [UserController::class, 'show']);
    Route::put('/{user}',              [UserController::class, 'update']);
    Route::delete('/{user}',           [UserController::class, 'destroy']);
    Route::post('/{user}/restore',     [UserController::class, 'restore'])->withTrashed();
});

// ── Audit trail (admin-only, read-only) ───────────────────────────────────────
Route::prefix('audit-logs')->group(static function (): void {
    Route::get('/',             [AuditLogController::class, 'index']);
    Route::get('/{auditLog}',   [AuditLogController::class, 'show']);
});
