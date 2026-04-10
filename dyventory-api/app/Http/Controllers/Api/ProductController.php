<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Requests\UploadProductImageRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * CRUD for products.
 *
 * GET    /api/v1/products               index
 * POST   /api/v1/products               store
 * GET    /api/v1/products/{product}      show
 * PUT    /api/v1/products/{product}      update
 * DELETE /api/v1/products/{product}      destroy
 * POST   /api/v1/products/{product}/archive    archive
 * POST   /api/v1/products/{product}/restore    restore
 */
class ProductController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly ProductService $products,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    // ─────────────────────────────────────────────
    // Index
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/products
     *
     * Query params: ?category_id, ?status, ?search, ?low_stock=1, ?per_page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Product::class);

        $paginator = $this->products->list($request->only([
            'category_id',
            'status',
            'search',
            'low_stock',
            'per_page',
        ]));

        return ProductResource::collection($paginator);
    }

    // ─────────────────────────────────────────────
    // Store
    // ─────────────────────────────────────────────

    /**
     * POST /api/v1/products
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = $this->products->create($request->validated());

        return (new ProductResource($product->load(['category', 'vatRate'])))
            ->response()
            ->setStatusCode(201);
    }

    // ─────────────────────────────────────────────
    // Show
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/products/{product}
     */
    public function show(Product $product): ProductResource
    {
        $this->authorize('view', $product);

        $product = $this->products->find($product->id);

        return new ProductResource($product);
    }

    // ─────────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────────

    /**
     * PUT /api/v1/products/{product}
     */
    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $this->authorize('update', $product);

        $updated = $this->products->update($product, $request->validated());

        return new ProductResource($updated);
    }

    // ─────────────────────────────────────────────
    // Destroy
    // ─────────────────────────────────────────────

    /**
     * DELETE /api/v1/products/{product}
     */
    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->products->delete($product);

        return response()->json(null, 204);
    }

    // ─────────────────────────────────────────────
    // Archive / Restore
    // ─────────────────────────────────────────────

    /**
     * POST /api/v1/products/{product}/archive
     */
    public function archive(Product $product): ProductResource
    {
        $this->authorize('update', $product);

        $archived = $this->products->archive($product);

        return new ProductResource($archived);
    }

    /**
     * POST /api/v1/products/{product}/restore
     */
    public function restore(Product $product): ProductResource
    {
        $this->authorize('update', $product);

        $restored = $this->products->restore($product);

        return new ProductResource($restored);
    }

    // ─────────────────────────────────────────────
    // Image Upload
    // ─────────────────────────────────────────────

    /**
     * POST /api/v1/products/{product}/images
     *
     * Upload a single image. Max 5 images per product.
     */
    public function uploadImage(UploadProductImageRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $images = $product->images ?? [];

        if (count($images) >= 5) {
            return response()->json([
                'message' => 'Maximum of 5 images per product reached.',
            ], 422);
        }

        $path = $request->file('image')->store(
            "products/{$product->id}",
            'public',
        );

        $images[] = $path;
        $product->update(['images' => $images]);

        return response()->json([
            'data' => [
                'path'   => $path,
                'url'    => asset("storage/{$path}"),
                'images' => $images,
            ],
        ], 201);
    }
}
