<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notification Routes  —  /api/v1/notifications/*
|--------------------------------------------------------------------------
|
| Thin inline routes — no full controller needed for simple notification ops.
|
| GET  /api/v1/notifications              Paginated list for current user
| POST /api/v1/notifications/{id}/read   Mark single as read
| POST /api/v1/notifications/read-all    Mark all as read
|
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/notifications', static function (Request $request) {
        $perPage = min((int) ($request->get('per_page', 20)), 50);

        $notifications = DB::table('notifications')
            ->where('notifiable_type', 'App\Models\User')
            ->where('notifiable_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'total'        => $notifications->total(),
                'per_page'     => $notifications->perPage(),
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
            ],
        ]);
    })->name('notifications.index');

    Route::post('/notifications/read-all', static function (Request $request) {
        DB::table('notifications')
            ->where('notifiable_type', 'App\Models\User')
            ->where('notifiable_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    })->name('notifications.read-all');

    Route::post('/notifications/{id}/read', static function (string $id, Request $request) {
        DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_id', $request->user()->id)
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    })->name('notifications.read');
});
