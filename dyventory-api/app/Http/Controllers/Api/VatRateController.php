<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVatRateRequest;
use App\Http\Requests\UpdateVatRateRequest;
use App\Http\Resources\VatRateResource;
use App\Models\VatRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

/**
 * VAT rate management (admin-only write, any authenticated user can read).
 *
 * GET    /api/v1/vat-rates              index
 * POST   /api/v1/vat-rates              store   (admin)
 * GET    /api/v1/vat-rates/{vatRate}    show
 * PUT    /api/v1/vat-rates/{vatRate}    update  (admin)
 * DELETE /api/v1/vat-rates/{vatRate}    destroy (admin — blocked if used by products)
 */
class VatRateController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    /** GET /vat-rates — accessible to all authenticated users (needed for product forms). */
    public function index(): AnonymousResourceCollection
    {
        return VatRateResource::collection(
            VatRate::orderBy('rate')->get()
        );
    }

    /** GET /vat-rates/{vatRate} */
    public function show(VatRate $vatRate): VatRateResource
    {
        return new VatRateResource($vatRate);
    }

    /** POST /vat-rates — admin only. Marks all others as non-default if is_default=true. */
    public function store(StoreVatRateRequest $request): JsonResponse
    {
        $this->authorize('create', VatRate::class);

        $vatRate = DB::transaction(function () use ($request): VatRate {
            $data = $request->validated();

            if (! empty($data['is_default'])) {
                VatRate::where('is_default', true)->update(['is_default' => false]);
            }

            return VatRate::create($data);
        });

        return (new VatRateResource($vatRate))
            ->response()
            ->setStatusCode(201);
    }

    /** PUT /vat-rates/{vatRate} — admin only. */
    public function update(UpdateVatRateRequest $request, VatRate $vatRate): VatRateResource
    {
        $this->authorize('update', VatRate::class);

        DB::transaction(function () use ($request, $vatRate): void {
            $data = $request->validated();

            // Ensure uniqueness of the default flag
            if (! empty($data['is_default'])) {
                VatRate::where('is_default', true)
                    ->where('id', '!=', $vatRate->id)
                    ->update(['is_default' => false]);
            }

            $vatRate->update($data);
        });

        return new VatRateResource($vatRate->refresh());
    }

    /** DELETE /vat-rates/{vatRate} — admin only, blocked if products use this rate. */
    public function destroy(VatRate $vatRate): JsonResponse
    {
        $this->authorize('delete', VatRate::class);

        if ($vatRate->is_default) {
            return response()->json(['message' => 'Cannot delete the default VAT rate.'], 422);
        }

        if ($vatRate->products()->exists()) {
            return response()->json([
                'message' => 'This VAT rate is assigned to one or more products and cannot be deleted.',
            ], 422);
        }

        $vatRate->delete();

        return response()->json(null, 204);
    }
}
