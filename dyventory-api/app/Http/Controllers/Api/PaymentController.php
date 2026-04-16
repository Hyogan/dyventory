<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SalePaymentResource;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

/**
 * Record and list payments against a sale.
 *
 * GET  /api/v1/sales/{sale}/payments   index
 * POST /api/v1/sales/{sale}/payments   store
 */
class PaymentController extends Controller implements HasMiddleware
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
     * GET /api/v1/sales/{sale}/payments
     */
    public function index(Sale $sale): AnonymousResourceCollection
    {
        $this->authorize('view', $sale);

        $payments = $sale->payments()->orderBy('paid_at', 'desc')->get();

        return SalePaymentResource::collection($payments);
    }

    /**
     * POST /api/v1/sales/{sale}/payments
     */
    public function store(Request $request, Sale $sale): JsonResponse
    {
        $this->authorize('recordPayment', $sale);

        $data = $request->validate([
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', Rule::in(['cash', 'mobile_money', 'bank_transfer'])],
            'reference'      => ['nullable', 'string', 'max:255'],
            'notes'          => ['nullable', 'string', 'max:500'],
            'paid_at'        => ['nullable', 'date'],
        ]);

        $payment = $this->sales->recordPayment($sale, $data, $request->user()->id);

        return (new SalePaymentResource($payment))
            ->response()
            ->setStatusCode(201);
    }
}
