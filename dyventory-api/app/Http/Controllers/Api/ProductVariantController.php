<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Nested CRUD for product variants.
 *
 * GET    /api/v1/products/{product}/variants
 * POST   /api/v1/products/{product}/variants
 * GET    /api/v1/variants/{variant}          (shallow)
 * PUT    /api/v1/variants/{variant}          (shallow)
 * DELETE /api/v1/variants/{variant}          (shallow)
 */
class ProductVariantController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    // ─────────────────────────────────────────────
    // Index
    // ─────────────────────────────────────────────

    public function index(Product $product): AnonymousResourceCollection
    {
        $this->authorize('view', $product);

        $variants = $product->variants()->orderBy('sku_variant')->get();

        return ProductVariantResource::collection($variants);
    }

    // ─────────────────────────────────────────────
    // Store
    // ─────────────────────────────────────────────

    public function store(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'sku_variant'           => ['sometimes', 'nullable', 'string', 'max:100', 'unique:product_variants,sku_variant'],
            'barcode_variant'       => ['sometimes', 'nullable', 'string', 'max:50', 'unique:product_variants,barcode_variant'],
            'attributes_variant'    => ['sometimes', 'array'],
            'stock_alert_threshold' => ['sometimes', 'numeric', 'min:0'],
            'price_override_ttc'    => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_active'             => ['sometimes', 'boolean'],
        ]);

        // Auto-generate variant SKU if not provided
        if (empty($validated['sku_variant'])) {
            $validated['sku_variant'] = $product->sku . '-' . strtoupper(Str::random(4));
        }

        $validated['product_id'] = $product->id;
        $variant = ProductVariant::create($validated);

        return (new ProductVariantResource($variant))
            ->response()
            ->setStatusCode(201);
    }

    // ─────────────────────────────────────────────
    // Show
    // ─────────────────────────────────────────────

    public function show(ProductVariant $variant): ProductVariantResource
    {
        $this->authorize('view', $variant->product);

        return new ProductVariantResource($variant);
    }

    // ─────────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────────

    public function update(Request $request, ProductVariant $variant): ProductVariantResource
    {
        $this->authorize('update', $variant->product);

        $validated = $request->validate([
            'sku_variant'           => ['sometimes', 'string', 'max:100', Rule::unique('product_variants', 'sku_variant')->ignore($variant)],
            'barcode_variant'       => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('product_variants', 'barcode_variant')->ignore($variant)],
            'attributes_variant'    => ['sometimes', 'array'],
            'stock_alert_threshold' => ['sometimes', 'numeric', 'min:0'],
            'price_override_ttc'    => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_active'             => ['sometimes', 'boolean'],
        ]);

        $variant->update($validated);

        return new ProductVariantResource($variant->fresh());
    }

    // ─────────────────────────────────────────────
    // Destroy
    // ─────────────────────────────────────────────

    public function destroy(ProductVariant $variant): JsonResponse
    {
        $this->authorize('update', $variant->product);

        $variant->delete();

        return response()->json(null, 204);
    }
}
