<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function __construct(
        private readonly FieldSchemaService $fieldSchema,
    ) {}

    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Paginated product listing with filters.
     *
     * Supported filters (all optional):
     *   - category_id  (int)
     *   - status       (string: 'active' | 'archived')
     *   - search       (string: name / SKU / barcode)
     *   - low_stock    (bool: only products at or below alert threshold)
     *   - per_page     (int: default 20, max 50)
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Product::with(['category', 'vatRate'])
            ->withCount('variants');

        if (! empty($filters['category_id'])) {
            $query->inCategory((int) $filters['category_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->active();
        }

        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (! empty($filters['low_stock'])) {
            $query->lowStock();
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Find a single product with all relations loaded.
     */
    public function find(int $id): Product
    {
        return Product::with(['category', 'vatRate', 'variants', 'batches'])
            ->withCount('variants')
            ->findOrFail($id);
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    /**
     * Create a new product.
     *
     * Validates the `attributes` JSONB against the category's field schema
     * for product-level fields.
     */
    public function create(array $data): Product
    {
        $category = Category::findOrFail($data['category_id']);

        // Validate dynamic attributes against category schema (product-level only)
        $productFields = $category->getProductFields()->map->toArray()->all();

        if (! empty($productFields)) {
            $this->fieldSchema->validateAttributes(
                $data['attributes'] ?? [],
                $productFields,
            );
        }

        // Auto-generate SKU if not provided
        if (empty($data['sku'])) {
            $data['sku'] = $this->generateSku($data['name'], $category);
        }

        // Auto-generate barcode if not provided
        if (empty($data['barcode'])) {
            $data['barcode'] = $this->generateBarcode();
        }

        $data['attributes'] ??= [];
        $data['images'] ??= [];

        return Product::create($data);
    }

    /**
     * Update an existing product.
     *
     * If category_id changes, re-validates attributes against the new schema.
     */
    public function update(Product $product, array $data): Product
    {
        $categoryId = $data['category_id'] ?? $product->category_id;
        $category = Category::findOrFail($categoryId);

        // If attributes are being updated or category changed, validate
        if (isset($data['attributes']) || $categoryId !== $product->category_id) {
            $productFields = $category->getProductFields()->map->toArray()->all();

            if (! empty($productFields)) {
                $attributes = $data['attributes'] ?? $product->attributes ?? [];

                $this->fieldSchema->validateAttributes($attributes, $productFields);
            }
        }

        $product->update($data);

        return $product->fresh(['category', 'vatRate', 'variants']);
    }

    /**
     * Archive a product (soft status change, not soft-delete).
     */
    public function archive(Product $product): Product
    {
        $product->update(['status' => 'archived']);

        return $product->fresh();
    }

    /**
     * Restore an archived product back to active.
     */
    public function restore(Product $product): Product
    {
        $product->update(['status' => 'active']);

        return $product->fresh();
    }

    /**
     * Permanently soft-delete a product.
     *
     * @throws ValidationException if the product has active stock
     */
    public function delete(Product $product): void
    {
        $currentStock = $product->current_stock;

        if ($currentStock > 0) {
            throw ValidationException::withMessages([
                'product' => ['Cannot delete a product with active stock (' . $currentStock . ' remaining). Archive it instead.'],
            ]);
        }

        $product->delete();
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Generate a unique SKU from name + category prefix.
     */
    private function generateSku(string $name, Category $category): string
    {
        $prefix = strtoupper(substr(Str::slug($category->name, ''), 0, 3));
        $base = strtoupper(substr(Str::slug($name, ''), 0, 5));
        $sku = "{$prefix}-{$base}-" . strtoupper(Str::random(4));

        // Ensure uniqueness
        while (Product::withTrashed()->where('sku', $sku)->exists()) {
            $sku = "{$prefix}-{$base}-" . strtoupper(Str::random(4));
        }

        return $sku;
    }

    /**
     * Generate a unique EAN-like barcode (13 digits).
     */
    private function generateBarcode(): string
    {
        do {
            $barcode = '200' . str_pad((string) random_int(0, 9_999_999_999), 10, '0', STR_PAD_LEFT);
        } while (Product::withTrashed()->where('barcode', $barcode)->exists());

        return $barcode;
    }
}
