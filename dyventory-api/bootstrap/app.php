<?php

declare(strict_types=1);

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        /*
         * Load versioned API route files from routes/api/v1/*.
         * Each feature area has its own route file — no monolithic api.php.
         */
        then: static function (): void {
            Route::prefix('api/v1')
                ->name('api.v1.')
                ->middleware('api')
                ->group(static function (): void {
                    require __DIR__ . '/../routes/api/v1/auth.php';
                    require __DIR__ . '/../routes/api/v1/categories.php';
                    require __DIR__ . '/../routes/api/v1/products.php';
                    require __DIR__ . '/../routes/api/v1/stock.php';
                    require __DIR__ . '/../routes/api/v1/notifications.php';
                    require __DIR__ . '/../routes/api/v1/sales.php';
                    require __DIR__ . '/../routes/api/v1/clients.php';
                    require __DIR__ . '/../routes/api/v1/suppliers.php';
                    // require __DIR__ . '/../routes/api/v1/reports.php'; // Phase 7
                    require __DIR__ . '/../routes/api/v1/users.php';
                    require __DIR__ . '/../routes/api/v1/settings.php';
                });
        },
    )
    ->withMiddleware(static function (Middleware $middleware): void {
        /*
         * Stateful API — required for Sanctum SPA cookie auth.
         * Adds EncryptCookies, AddQueuedCookiesToResponse, StartSession,
         * and EnsureFrontendRequestsAreStateful to the sanctum middleware group.
         */
        $middleware->statefulApi();

        /*
         * CSRF protection — Laravel 13 renames VerifyCsrfToken to PreventRequestForgery.
         * Our API uses Sanctum token auth, so the entire api/* namespace is excluded.
         */
        $middleware->preventRequestForgery(except: ['api/*']);

        /*
         * Trim strings and convert empty strings to null on every incoming request.
         */
        $middleware->trimStrings();
        $middleware->convertEmptyStringsToNull();
    })
    ->withExceptions(static function (Exceptions $exceptions): void {
        /*
         * Return consistent JSON envelopes for all expected exception types
         * when the request expects a JSON response (i.e. our API consumers).
         */

        // 422 — Validation failed
        $exceptions->render(static function (
            ValidationException $e,
            Request $request,
        ): ?\Illuminate\Http\JsonResponse {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'message' => __('messages.validation_failed'),
                'errors'  => $e->errors(),
            ], 422);
        });

        // 404 — Model not found (route model binding)
        $exceptions->render(static function (
            ModelNotFoundException $e,
            Request $request,
        ): ?\Illuminate\Http\JsonResponse {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'message' => __('messages.resource_not_found'),
            ], 404);
        });

        // 403 — Authorisation failed (Policy gate)
        $exceptions->render(static function (
            AuthorizationException $e,
            Request $request,
        ): ?\Illuminate\Http\JsonResponse {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'message' => __('messages.action_unauthorized'),
            ], 403);
        });

        // 401 — Unauthenticated (missing / expired Sanctum token)
        $exceptions->render(static function (
            AuthenticationException $e,
            Request $request,
        ): ?\Illuminate\Http\JsonResponse {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'message' => __('auth.unauthenticated'),
            ], 401);
        });
    })
    ->create();

//  <?php

// use Illuminate\Foundation\Application;
// use Illuminate\Foundation\Configuration\Exceptions;
// use Illuminate\Foundation\Configuration\Middleware;

// return Application::configure(basePath: dirname(__DIR__))
//     ->withRouting(
//         web: __DIR__.'/../routes/web.php',
//         api: __DIR__.'/../routes/api.php',
//         commands: __DIR__.'/../routes/console.php',
//         health: '/up',
//     )
//     ->withMiddleware(function (Middleware $middleware): void {
//         //
//     })
//     ->withExceptions(function (Exceptions $exceptions): void {
//         //
//     })->create(); -->
