<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AuditLog as AuditLogModel;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Writes an immutable audit log entry for every mutating API request
 * that is handled by an authenticated user.
 *
 * Registered in bootstrap/app.php on the auth:sanctum middleware group,
 * so it fires after authentication is confirmed.
 *
 * What gets logged:
 *  - user_id, action (create|update|delete), entity type + id
 *  - old_values — Eloquent original() attributes before the request ran
 *  - new_values — sanitised request input (passwords stripped)
 *  - ip_address, user_agent, route name, HTTP method, response status code
 *
 * What is explicitly NOT logged:
 *  - GET / HEAD requests (read-only, no mutation)
 *  - auth.login / auth.logout routes (sensitive, no useful delta)
 *  - Unauthenticated requests (no user_id to attach)
 *  - 5xx server errors (the change did not actually happen)
 *
 * This middleware must never throw — a logging failure must not break
 * the API response.
 */
class AuditLog
{
    /**
     * HTTP methods that indicate a mutating operation.
     *
     * @var list<string>
     */
    private const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /**
     * Named route prefixes to skip entirely.
     * Login/logout are excluded because they are security-sensitive and
     * produce no meaningful old/new delta — the AuthController already
     * handles token lifecycle.
     *
     * @var list<string>
     */
    private const EXCLUDED_ROUTE_PREFIXES = [
        'api.v1.auth.login',
        'api.v1.auth.logout',
    ];

    /**
     * Request keys that must never appear in the audit log.
     *
     * @var list<string>
     */
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        '_token',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldAudit($request, $response)) {
            $this->writeLog($request, $response);
        }

        return $response;
    }

    // ─────────────────────────────────────────────
    // Decision helpers
    // ─────────────────────────────────────────────

    private function shouldAudit(Request $request, Response $response): bool
    {
        // Only mutating HTTP verbs
        if (! in_array($request->method(), self::AUDITED_METHODS, strict: true)) {
            return false;
        }

        // Skip excluded routes
        $routeName = $request->route()?->getName() ?? '';
        foreach (self::EXCLUDED_ROUTE_PREFIXES as $prefix) {
            if (str_starts_with($routeName, $prefix)) {
                return false;
            }
        }

        // Only log authenticated requests (user must be resolved)
        if ($request->user() === null) {
            return false;
        }

        // Only log when the action actually ran (not 5xx server errors)
        return $response->getStatusCode() < 500;
    }

    // ─────────────────────────────────────────────
    // Log writer
    // ─────────────────────────────────────────────

    private function writeLog(Request $request, Response $response): void
    {
        try {
            /** @var \App\Models\User $user */
            $user = $request->user();

            [$entityType, $entityId, $oldValues] = $this->extractEntityData($request);

            $action = $this->resolveAction($request->method());

            // Sanitise new values — strip sensitive fields
            $newValues = in_array($request->method(), ['POST', 'PUT', 'PATCH'], strict: true)
                ? $this->sanitise($request->all())
                : [];

            AuditLogModel::create([
                'user_id'     => $user->id,
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'old_values'  => empty($oldValues) ? null : $oldValues,
                'new_values'  => empty($newValues) ? null : $newValues,
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'route'       => $request->route()?->getName(),
                'http_method' => $request->method(),
                'status_code' => $response->getStatusCode(),
            ]);
        } catch (Throwable $e) {
            // Never let the audit writer crash the application.
            // Log the failure for ops visibility but swallow it.
            Log::error('[AuditLog middleware] Failed to write audit entry', [
                'error'   => $e->getMessage(),
                'url'     => $request->fullUrl(),
                'method'  => $request->method(),
                'user_id' => $request->user()?->id,
            ]);
        }
    }

    // ─────────────────────────────────────────────
    // Entity extraction
    // ─────────────────────────────────────────────

    /**
     * Extract entity type, id, and the before-state from route model bindings.
     *
     * @return array{string|null, int|null, array<string, mixed>}
     */
    private function extractEntityData(Request $request): array
    {
        $routeParameters = $request->route()?->parameters() ?? [];

        foreach ($routeParameters as $value) {
            if ($value instanceof Model) {
                return [
                    get_class($value),
                    $value->getKey(),
                    $value->getOriginal(),   // snapshot before the request ran
                ];
            }
        }

        // No model binding — guess the entity from the URI structure:
        // /api/v1/{entity}/{id?} → entity name is the segment after 'v1'
        return [
            $this->guessEntityFromUri($request),
            null,
            [],
        ];
    }

    /**
     * Best-effort entity name for routes without model binding.
     * e.g. /api/v1/categories/42/schema → "Category"
     */
    private function guessEntityFromUri(Request $request): string
    {
        $segments  = $request->segments(); // ['api', 'v1', 'categories', '42', 'schema']
        $v1Offset  = array_search('v1', $segments, strict: true);

        if ($v1Offset !== false && isset($segments[$v1Offset + 1])) {
            $raw = $segments[$v1Offset + 1];          // 'categories'
            $singular = rtrim($raw, 's');             // rough singularisation
            return ucfirst($singular);                // 'Category'
        }

        return 'Unknown';
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private function resolveAction(string $method): string
    {
        return match ($method) {
            'POST'           => 'create',
            'PUT', 'PATCH'   => 'update',
            'DELETE'         => 'delete',
            default          => strtolower($method),
        };
    }

    /**
     * Remove sensitive keys from request input before storing.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function sanitise(array $data): array
    {
        return array_diff_key($data, array_flip(self::SENSITIVE_KEYS));
    }
}
