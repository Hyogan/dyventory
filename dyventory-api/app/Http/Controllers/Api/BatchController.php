<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBatchRequest;
use App\Http\Requests\UpdateBatchRequest;
use App\Http\Resources\BatchResource;
use App\Models\Batch;
use App\Services\BatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * CRUD for stock batches.
 *
 * GET    /api/v1/batches                 index   (?product_id, ?status, ?expiry_warning)
 * POST   /api/v1/batches                 store
 * GET    /api/v1/batches/{batch}         show
 * PUT    /api/v1/batches/{batch}         update
 * POST   /api/v1/batches/{batch}/expire  markExpired
 */
class BatchController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly BatchService $batches,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    /**
     * GET /api/v1/batches
     *
     * Query params: ?product_id, ?variant_id, ?status, ?expiry_warning=1, ?per_page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Batch::class);

        $paginator = $this->batches->list($request->only([
            'product_id',
            'variant_id',
            'status',
            'expiry_warning',
            'per_page',
        ]));

        return BatchResource::collection($paginator);
    }

    /**
     * POST /api/v1/batches
     */
    public function store(StoreBatchRequest $request): JsonResponse
    {
        $this->authorize('create', Batch::class);

        $batch = $this->batches->create($request->validated());

        return (new BatchResource($batch->load(['product', 'variant', 'supplier'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/v1/batches/{batch}
     */
    public function show(Batch $batch): BatchResource
    {
        $this->authorize('view', $batch);

        return new BatchResource($this->batches->find($batch->id));
    }

    /**
     * PUT /api/v1/batches/{batch}
     */
    public function update(UpdateBatchRequest $request, Batch $batch): BatchResource
    {
        $this->authorize('update', $batch);

        $updated = $this->batches->update($batch, $request->validated());

        return new BatchResource($updated);
    }

    /**
     * POST /api/v1/batches/{batch}/expire
     */
    public function expire(Batch $batch): BatchResource
    {
        $this->authorize('update', $batch);

        $expired = $this->batches->markExpired($batch);

        return new BatchResource($expired);
    }
}
