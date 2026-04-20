<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePromotionRequest;
use App\Http\Requests\UpdatePromotionRequest;
use App\Http\Resources\PromotionResource;
use App\Models\Promotion;
use App\Services\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * GET    /api/v1/promotions          index   (?search, ?type, ?is_active, ?per_page)
 * GET    /api/v1/promotions/active   active  — running promotions for POS
 * POST   /api/v1/promotions          store
 * GET    /api/v1/promotions/{id}     show
 * PUT    /api/v1/promotions/{id}     update
 * DELETE /api/v1/promotions/{id}     destroy
 */
class PromotionController extends Controller implements HasMiddleware
{
    public function __construct(private readonly PromotionService $promotions) {}

    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Promotion::class);

        return PromotionResource::collection(
            $this->promotions->list($request->only(['search', 'type', 'is_active', 'per_page']))
        );
    }

    /** Currently-running promotions — lightweight, for POS autocomplete. */
    public function active(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Promotion::class);

        return PromotionResource::collection($this->promotions->active());
    }

    public function store(StorePromotionRequest $request): JsonResponse
    {
        $this->authorize('create', Promotion::class);

        $promotion = $this->promotions->create($request->validated());

        return (new PromotionResource($promotion))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Promotion $promotion): PromotionResource
    {
        $this->authorize('view', $promotion);

        return new PromotionResource($promotion);
    }

    public function update(UpdatePromotionRequest $request, Promotion $promotion): PromotionResource
    {
        $this->authorize('update', $promotion);

        return new PromotionResource($this->promotions->update($promotion, $request->validated()));
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        $this->authorize('delete', $promotion);

        $this->promotions->delete($promotion);

        return response()->json(null, 204);
    }
}
