<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\ReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

/**
 * Return management for sales.
 *
 * GET  /api/v1/sales/{sale}/returns   index
 * POST /api/v1/sales/{sale}/returns   store
 */
class ReturnController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly ReturnService $returns,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    /**
     * GET /api/v1/sales/{sale}/returns
     */
    public function index(Sale $sale): JsonResponse
    {
        $this->authorize('view', $sale);

        $returns = $this->returns->listForSale($sale);

        return response()->json(['data' => $returns]);
    }

    /**
     * POST /api/v1/sales/{sale}/returns
     */
    public function store(Request $request, Sale $sale): JsonResponse
    {
        $this->authorize('processReturn', $sale);

        // Load items so ReturnService can validate against them
        $sale->loadMissing('items');

        $data = $request->validate([
            'reason'          => ['required', 'string', 'max:500'],
            'resolution'      => ['required', 'string', Rule::in(['refund', 'credit_note', 'exchange'])],
            'refund_amount'   => ['nullable', 'numeric', 'min:0'],
            'restock'         => ['nullable', 'boolean'],
            'notes'           => ['nullable', 'string', 'max:1000'],
            'items'           => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'   => ['required', 'numeric', 'min:0.001'],
            'items.*.batch_id'   => ['nullable', 'integer', 'exists:batches,id'],
        ]);

        $saleReturn = $this->returns->create($sale, $data, $request->user()->id);

        return response()->json(['data' => $saleReturn], 201);
    }
}
