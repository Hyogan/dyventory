<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryFieldSchemaRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use App\Services\FieldSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
// use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
// use Illuminate\Foundation\Validation\ValidatesRequests;

/**
 * CRUD for categories + field schema management.
 *
 * GET    /api/v1/categories            index   (flat list; ?tree=1 for nested)
 * POST   /api/v1/categories            store
 * GET    /api/v1/categories/{id}       show
 * PUT    /api/v1/categories/{id}       update
 * DELETE /api/v1/categories/{id}       destroy
 * PUT    /api/v1/categories/{id}/schema updateSchema
 */
class CategoryController extends Controller implements HasMiddleware
{
    // use AuthorizesRequests, ValidatesRequests;
    public function __construct(
        private readonly CategoryService    $categories,
        private readonly FieldSchemaService $fieldSchema,
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
     * GET /api/v1/categories
     *
     * Query params:
     *   ?tree=1  → nested tree (useful for sidebar/dropdowns)
     *   default  → flat ordered list
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Category::class);

        $data = $request->boolean('tree')
            ? $this->categories->getTree()
            : $this->categories->getAll();

        return CategoryResource::collection($data);
    }

    // ─────────────────────────────────────────────
    // Store
    // ─────────────────────────────────────────────

    /**
     * POST /api/v1/categories
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $category = $this->categories->create($request->validated());

        return (new CategoryResource($category->load(['parent', 'children'])))
            ->response()
            ->setStatusCode(201);
    }

    // ─────────────────────────────────────────────
    // Show
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/categories/{category}
     */
    public function show(Category $category): CategoryResource
    {
        $this->authorize('view', $category);

        $category->load(['parent', 'children']);
        $category->loadCount(['children', 'products']);

        return new CategoryResource($category);
    }

    // ─────────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────────

    /**
     * PUT /api/v1/categories/{category}
     *
     * Updates category metadata only. For schema changes use PUT .../schema.
     */
    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $this->authorize('update', $category);

        $updated = $this->categories->update($category, $request->validated());

        return new CategoryResource($updated);
    }

    // ─────────────────────────────────────────────
    // Destroy
    // ─────────────────────────────────────────────

    /**
     * DELETE /api/v1/categories/{category}
     *
     * Fails with 422 if the category has children or products.
     */
    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $this->categories->delete($category);

        return response()->json(null, 204);
    }

    // ─────────────────────────────────────────────
    // Field Schema
    // ─────────────────────────────────────────────

    /**
     * PUT /api/v1/categories/{category}/schema
     *
     * Replace the category's field schema. Field keys are immutable once saved.
     * Validated at two levels:
     *   1. UpdateCategoryFieldSchemaRequest — shape / Laravel rules
     *   2. FieldSchemaService::validateSchema() — semantic rules (dups, options, ranges)
     */
    public function updateSchema(
        UpdateCategoryFieldSchemaRequest $request,
        Category $category,
    ): CategoryResource {
        $this->authorize('manageSchema', $category);

        $schema = $request->validated('schema');

        // Deep semantic validation (duplicate keys, option arrays, min≤max, etc.)
        $this->fieldSchema->validateSchema($schema);

        $updated = $this->categories->updateFieldSchema($category, $schema);

        return new CategoryResource($updated);
    }
}
