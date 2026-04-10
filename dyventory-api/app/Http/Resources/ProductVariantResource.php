<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ProductVariant
 */
class ProductVariantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'product_id'            => $this->product_id,
            'sku_variant'           => $this->sku_variant,
            'barcode_variant'       => $this->barcode_variant,
            'attributes_variant'    => $this->attributes_variant,
            'stock_alert_threshold' => $this->stock_alert_threshold,
            'price_override_ttc'    => $this->price_override_ttc,
            'is_active'             => $this->is_active,
            'created_at'            => $this->created_at?->toISOString(),
            'updated_at'            => $this->updated_at?->toISOString(),
        ];
    }
}
