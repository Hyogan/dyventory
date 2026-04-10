<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * @mixin \App\Models\Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'sku'                   => $this->sku,
            'description'           => $this->description,
            'unit_of_measure'       => $this->unit_of_measure,
            'barcode'               => $this->barcode,
            'stock_alert_threshold' => $this->stock_alert_threshold,
            'has_variants'          => $this->has_variants,
            'attributes'            => $this->attributes,
            'images'                => $this->images ?? [],
            'status'                => $this->status,

            // Selling price is always visible
            'price_sell_ttc' => $this->price_sell_ttc,

            // Financial fields — only visible to Admin / Manager
            'price_buy_ht' => $this->when(
                Gate::allows('viewFinancials', $this->resource),
                fn () => $this->price_buy_ht,
            ),
            'margin' => $this->when(
                Gate::allows('viewFinancials', $this->resource),
                fn () => $this->price_sell_ttc && $this->price_buy_ht
                    ? bcsub((string) $this->price_sell_ttc, (string) $this->price_buy_ht, 2)
                    : null,
            ),

            // Computed stock
            'current_stock' => $this->current_stock,

            // Relations
            'category_id' => $this->category_id,
            'vat_rate_id' => $this->vat_rate_id,

            'category' => new CategoryResource($this->whenLoaded('category')),
            'vat_rate' => $this->when(
                $this->relationLoaded('vatRate') && $this->vatRate !== null,
                fn () => [
                    'id'         => $this->vatRate->id,
                    'name'       => $this->vatRate->name,
                    'rate'       => $this->vatRate->rate,
                    'is_default' => $this->vatRate->is_default,
                ],
            ),

            'variants_count' => $this->whenCounted('variants'),

            'variants' => ProductVariantResource::collection(
                $this->whenLoaded('variants'),
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
