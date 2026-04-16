<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Supplier CRUD + search + procurement summary.
 *
 * GET    /api/v1/suppliers                    index   (?search, ?is_active, ?per_page)
 * GET    /api/v1/suppliers/search             search  (?q) — autocomplete
 * POST   /api/v1/suppliers                    store
 * GET    /api/v1/suppliers/{supplier}         show
 * GET    /api/v1/suppliers/{supplier}/summary summary — order stats + spend
 * PUT    /api/v1/suppliers/{supplier}         update
 * DELETE /api/v1/suppliers/{supplier}         destroy
 */
class SupplierController extends Controller implements HasMiddleware
{
    public function __construct(private readonly SupplierService $suppliers) {}

    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Supplier::class);

        return SupplierResource::collection(
            $this->suppliers->list($request->only(['search', 'is_active', 'per_page']))
        );
    }

    /** Lightweight autocomplete — returns up to 15 matching active suppliers. */
    public function search(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Supplier::class);

        $results = $this->suppliers->search((string) $request->query('q', ''));

        return response()->json(['data' => SupplierResource::collection($results)]);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $this->authorize('create', Supplier::class);

        $supplier = $this->suppliers->create($request->validated());

        return (new SupplierResource($supplier))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Supplier $supplier): SupplierResource
    {
        $this->authorize('view', $supplier);

        return new SupplierResource($supplier);
    }

    /** Procurement summary: order count, spend, pending. */
    public function summary(Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        return response()->json(['data' => $this->suppliers->summary($supplier)]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): SupplierResource
    {
        $this->authorize('update', $supplier);

        return new SupplierResource($this->suppliers->update($supplier, $request->validated()));
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $this->authorize('delete', $supplier);

        $this->suppliers->delete($supplier);

        return response()->json(null, 204);
    }
}
