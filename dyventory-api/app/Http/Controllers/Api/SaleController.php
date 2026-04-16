<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Sale CRUD + lifecycle endpoints.
 *
 * GET    /api/v1/sales                         index
 * POST   /api/v1/sales                         store
 * GET    /api/v1/sales/{sale}                  show
 * POST   /api/v1/sales/{sale}/confirm          confirm
 * POST   /api/v1/sales/{sale}/deliver          deliver
 * POST   /api/v1/sales/{sale}/cancel           cancel
 */
class SaleController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly SaleService $sales,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    /**
     * GET /api/v1/sales
     *
     * Query params: ?status, ?payment_status, ?client_id, ?date_from, ?date_to, ?search, ?per_page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Sale::class);

        $paginator = $this->sales->list($request->only([
            'status',
            'payment_status',
            'client_id',
            'date_from',
            'date_to',
            'search',
            'per_page',
        ]));

        return SaleResource::collection($paginator);
    }

    /**
     * POST /api/v1/sales
     */
    public function store(StoreSaleRequest $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $sale = $this->sales->create(
            $request->validated(),
            $request->user()->id,
        );

        return (new SaleResource($sale))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/v1/sales/{sale}
     */
    public function show(Sale $sale): SaleResource
    {
        $this->authorize('view', $sale);

        return new SaleResource($this->sales->find($sale->id));
    }

    /**
     * POST /api/v1/sales/{sale}/confirm
     */
    public function confirm(Sale $sale, Request $request): SaleResource
    {
        $this->authorize('create', Sale::class);

        $confirmed = $this->sales->confirm($sale, $request->user()->id);

        return new SaleResource($confirmed);
    }

    /**
     * POST /api/v1/sales/{sale}/deliver
     */
    public function deliver(Sale $sale): SaleResource
    {
        $this->authorize('view', $sale);

        $delivered = $this->sales->markDelivered($sale);

        return new SaleResource($delivered);
    }

    /**
     * POST /api/v1/sales/{sale}/cancel
     */
    public function cancel(Sale $sale): SaleResource
    {
        $this->authorize('cancel', $sale);

        $cancelled = $this->sales->cancel($sale);

        return new SaleResource($cancelled);
    }
}
