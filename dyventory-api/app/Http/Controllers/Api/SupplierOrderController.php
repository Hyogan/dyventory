<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReceiveSupplierOrderRequest;
use App\Http\Requests\StoreSupplierOrderRequest;
use App\Http\Requests\UpdateSupplierOrderRequest;
use App\Http\Resources\SupplierOrderResource;
use App\Models\Supplier;
use App\Models\SupplierOrder;
use App\Services\SupplierOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Supplier order lifecycle controller.
 *
 * Nested under suppliers:
 *   GET    /api/v1/suppliers/{supplier}/orders          index
 *   POST   /api/v1/suppliers/{supplier}/orders          store
 *
 * Standalone (order-level):
 *   GET    /api/v1/supplier-orders/{order}              show
 *   PUT    /api/v1/supplier-orders/{order}              update  (draft only — replace items)
 *   POST   /api/v1/supplier-orders/{order}/send         send
 *   POST   /api/v1/supplier-orders/{order}/confirm      confirm
 *   POST   /api/v1/supplier-orders/{order}/cancel       cancel
 *   POST   /api/v1/supplier-orders/{order}/receive      receive (creates batches + stock entries)
 */
class SupplierOrderController extends Controller implements HasMiddleware
{
    public function __construct(private readonly SupplierOrderService $orders) {}

    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    /** GET /suppliers/{supplier}/orders */
    public function index(Request $request, Supplier $supplier): AnonymousResourceCollection
    {
        $this->authorize('manageOrders', $supplier);

        return SupplierOrderResource::collection(
            $this->orders->list($supplier->id, $request->only(['status', 'per_page']))
        );
    }

    /** POST /suppliers/{supplier}/orders */
    public function store(StoreSupplierOrderRequest $request, Supplier $supplier): JsonResponse
    {
        $this->authorize('manageOrders', $supplier);

        $data                = $request->validated();
        $data['supplier_id'] = $supplier->id;

        $order = $this->orders->create($data, $request->user()->id);

        return (new SupplierOrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    /** GET /supplier-orders/{supplierOrder} */
    public function show(SupplierOrder $supplierOrder): SupplierOrderResource
    {
        $supplierOrder->loadMissing('supplier');
        $this->authorize('manageOrders', $supplierOrder->supplier);

        return new SupplierOrderResource($this->orders->find($supplierOrder->id));
    }

    /** PUT /supplier-orders/{supplierOrder} — edit items on a draft order */
    public function update(UpdateSupplierOrderRequest $request, SupplierOrder $supplierOrder): SupplierOrderResource
    {
        $supplierOrder->loadMissing('supplier');
        $this->authorize('manageOrders', $supplierOrder->supplier);

        return new SupplierOrderResource(
            $this->orders->update($supplierOrder, $request->validated())
        );
    }

    /** POST /supplier-orders/{supplierOrder}/send */
    public function send(SupplierOrder $supplierOrder): SupplierOrderResource
    {
        $supplierOrder->loadMissing('supplier');
        $this->authorize('manageOrders', $supplierOrder->supplier);

        return new SupplierOrderResource($this->orders->send($supplierOrder));
    }

    /** POST /supplier-orders/{supplierOrder}/confirm */
    public function confirm(SupplierOrder $supplierOrder): SupplierOrderResource
    {
        $supplierOrder->loadMissing('supplier');
        $this->authorize('manageOrders', $supplierOrder->supplier);

        return new SupplierOrderResource($this->orders->confirm($supplierOrder));
    }

    /** POST /supplier-orders/{supplierOrder}/cancel */
    public function cancel(SupplierOrder $supplierOrder): SupplierOrderResource
    {
        $supplierOrder->loadMissing('supplier');
        $this->authorize('manageOrders', $supplierOrder->supplier);

        return new SupplierOrderResource($this->orders->cancel($supplierOrder));
    }

    /** POST /supplier-orders/{supplierOrder}/receive — receive stock, creates batches */
    public function receive(ReceiveSupplierOrderRequest $request, SupplierOrder $supplierOrder): SupplierOrderResource
    {
        $supplierOrder->loadMissing('supplier');
        $this->authorize('manageOrders', $supplierOrder->supplier);

        return new SupplierOrderResource(
            $this->orders->receive($supplierOrder, $request->validated(), $request->user()->id)
        );
    }
}
