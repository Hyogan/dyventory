<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Attributes\Middleware;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\Auth;

/**
 * Handles Sanctum token-based authentication.
 *
 * Public:    POST /api/v1/auth/login
 * Protected: POST /api/v1/auth/logout
 *            GET  /api/v1/auth/me
 */
class AuthController extends Controller implements HasMiddleware
{
    /**
     * Apply auth:sanctum to all methods except login.
     * Laravel 13 #[Middleware] attribute replaces constructor middleware() calls.
     *
     * @return list<\Illuminate\Routing\Controllers\MiddlewareInterface|string>
     */
    public static function middleware(): array
    {
        return [
            // Protect every route in this controller by default …
            new \Illuminate\Routing\Controllers\Middleware(
                middleware: 'auth:sanctum',
                // … except the login endpoint, which must be publicly accessible.
                except: ['login'],
            ),
        ];
    }

    // ─────────────────────────────────────────────
    // Public endpoint
    // ─────────────────────────────────────────────

    /**
     * Authenticate a user and return a scoped Sanctum token.
     *
     * Flow:
     *  1. Validate credentials via LoginRequest.
     *  2. Attempt Auth — 401 on failure.
     *  3. Revoke all previous tokens (single active session per user).
     *  4. Mint a new token scoped to the user's role permissions.
     *  5. Return token + UserResource.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => __('auth.failed'),
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Revoke existing tokens — enforce single active session.
        $user->tokens()->delete();

        // Mint a scoped token — abilities derived from the user's role.
        $token = $user
            ->createToken(
                name: 'api-token',
                abilities: $user->role->permissions(),
            )
            ->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user'  => new UserResource($user),
            ],
        ], 200);
    }

    // ─────────────────────────────────────────────
    // Protected endpoints (require auth:sanctum)
    // ─────────────────────────────────────────────

    /**
     * Revoke the current access token and sign the user out.
     */
    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    /**
     * Return the currently authenticated user.
     * Used by the frontend on every page load to rehydrate session state.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ]);
    }
}
