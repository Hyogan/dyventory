<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Read-only view of the audit trail (admin only).
 *
 * GET  /api/v1/audit-logs        index  (?user_id, ?entity_type, ?action, ?date_from, ?date_to, ?search, ?per_page)
 * GET  /api/v1/audit-logs/{log}  show
 */
class AuditLogController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->query('user_id'));
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', 'ilike', '%' . $request->query('entity_type') . '%');
        }

        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->filled('http_method')) {
            $query->where('http_method', strtoupper($request->query('http_method')));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->query('date_to'));
        }

        if ($request->filled('search')) {
            $term = $request->query('search');
            $query->where(static fn ($q) => $q
                ->where('route', 'ilike', "%{$term}%")
                ->orWhere('entity_type', 'ilike', "%{$term}%")
                ->orWhere('action', 'ilike', "%{$term}%")
            );
        }

        $perPage = min((int) $request->query('per_page', 30), 100);

        return AuditLogResource::collection($query->paginate($perPage));
    }

    public function show(AuditLog $auditLog): AuditLogResource
    {
        $this->authorize('view', $auditLog);

        return new AuditLogResource($auditLog->load('user'));
    }
}
