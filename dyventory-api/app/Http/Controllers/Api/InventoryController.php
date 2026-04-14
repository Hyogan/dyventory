<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventorySessionResource;
use App\Models\InventorySession;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Inventory session flow.
 *
 * POST /api/v1/stock/inventory/start               start session
 * GET  /api/v1/stock/inventory/{session}           show
 * POST /api/v1/stock/inventory/{session}/counts    submit counts
 * GET  /api/v1/stock/inventory/{session}/discrepancies  preview discrepancies
 * POST /api/v1/stock/inventory/{session}/validate  apply adjustments + complete
 * POST /api/v1/stock/inventory/{session}/cancel    cancel session
 */
class InventoryController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly InventoryService $inventory,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    /**
     * POST /api/v1/stock/inventory/start
     */
    public function start(Request $request): JsonResponse
    {
        $this->authorize('create', InventorySession::class);

        $session = $this->inventory->start($request->user());

        return (new InventorySessionResource($session))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/v1/stock/inventory/{session}
     */
    public function show(InventorySession $session): InventorySessionResource
    {
        $this->authorize('view', $session);

        return new InventorySessionResource($session->load('user'));
    }

    /**
     * POST /api/v1/stock/inventory/{session}/counts
     *
     * Body: { "counts": [ { "batch_id": 1, "counted_quantity": 11.5 }, ... ] }
     */
    public function submitCounts(Request $request, InventorySession $session): InventorySessionResource
    {
        $this->authorize('update', $session);

        $data = $request->validate([
            'counts'                      => ['required', 'array'],
            'counts.*.batch_id'           => ['required', 'integer', 'exists:batches,id'],
            'counts.*.counted_quantity'   => ['required', 'numeric', 'min:0'],
        ]);

        $updated = $this->inventory->submitCounts($session, $data['counts']);

        return new InventorySessionResource($updated);
    }

    /**
     * GET /api/v1/stock/inventory/{session}/discrepancies
     *
     * Preview discrepancies without committing anything.
     */
    public function discrepancies(InventorySession $session): JsonResponse
    {
        $this->authorize('view', $session);

        $items = $this->inventory->computeDiscrepancies($session);

        return response()->json(['data' => $items]);
    }

    /**
     * POST /api/v1/stock/inventory/{session}/validate
     *
     * Apply stock adjustments and mark session completed.
     */
    public function validate(InventorySession $session): InventorySessionResource
    {
        $this->authorize('update', $session);

        $completed = $this->inventory->validate($session);

        return new InventorySessionResource($completed);
    }

    /**
     * POST /api/v1/stock/inventory/{session}/cancel
     */
    public function cancel(InventorySession $session): InventorySessionResource
    {
        $this->authorize('update', $session);

        $cancelled = $this->inventory->cancel($session);

        return new InventorySessionResource($cancelled);
    }
}
