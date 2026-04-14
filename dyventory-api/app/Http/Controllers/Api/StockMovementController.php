<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\MovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStockMovementRequest;
use App\Http\Resources\StockMovementResource;
use App\Models\StockMovement;
use App\Services\StockMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Records stock movements (entries, exits, adjustments).
 *
 * GET  /api/v1/stock/movements         index    (history with filters)
 * GET  /api/v1/stock/movements/{id}    show
 * POST /api/v1/stock/entry             entry    (in_purchase | in_return)
 * POST /api/v1/stock/exit              exit     (out_sale | out_loss | out_expiry | out_mortality)
 * POST /api/v1/stock/adjustment        adjustment
 */
class StockMovementController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly StockMovementService $movements,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    /**
     * GET /api/v1/stock/movements
     *
     * Query params: ?product_id, ?batch_id, ?type, ?user_id, ?date_from, ?date_to, ?per_page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', StockMovement::class);

        $paginator = $this->movements->list($request->only([
            'product_id',
            'batch_id',
            'type',
            'user_id',
            'date_from',
            'date_to',
            'per_page',
        ]));

        return StockMovementResource::collection($paginator);
    }

    /**
     * GET /api/v1/stock/movements/{movement}
     */
    public function show(StockMovement $movement): StockMovementResource
    {
        $this->authorize('view', $movement);

        $movement->load(['product', 'variant', 'batch', 'user']);

        return new StockMovementResource($movement);
    }

    /**
     * POST /api/v1/stock/entry
     *
     * Records in_purchase or in_return. Requires batch_id.
     */
    public function entry(StoreStockMovementRequest $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $data          = $request->validated();
        $data['user_id'] = $request->user()->id;

        // Default to in_purchase if not specified
        $data['type'] ??= MovementType::InPurchase->value;

        $movement = $this->movements->recordEntry($data);

        return (new StockMovementResource($movement->load(['product', 'batch', 'user'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/v1/stock/exit
     *
     * Records out_sale, out_loss, out_expiry, or out_mortality.
     * Applies FEFO automatically if batch_id is omitted.
     */
    public function exit(StoreStockMovementRequest $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $data            = $request->validated();
        $data['user_id'] = $request->user()->id;

        // Default to out_sale if not specified
        $data['type'] ??= MovementType::OutSale->value;

        $movements = $this->movements->recordExit($data);

        return response()->json([
            'data' => StockMovementResource::collection($movements)->resolve(),
        ], 201);
    }

    /**
     * POST /api/v1/stock/adjustment
     *
     * Sets batch quantity to the given absolute value and records the delta.
     */
    public function adjustment(StoreStockMovementRequest $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $data            = $request->validated();
        $data['user_id'] = $request->user()->id;

        $movement = $this->movements->recordAdjustment($data);

        return (new StockMovementResource($movement->load(['product', 'batch', 'user'])))
            ->response()
            ->setStatusCode(201);
    }
}
