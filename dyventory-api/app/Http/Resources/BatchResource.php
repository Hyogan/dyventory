<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'product_id'       => $this->product_id,
            'variant_id'       => $this->variant_id,
            'supplier_id'      => $this->supplier_id,
            'batch_number'     => $this->batch_number,
            'received_at'      => $this->received_at?->toIso8601String(),
            'initial_quantity' => (float) $this->initial_quantity,
            'current_quantity' => (float) $this->current_quantity,
            'attributes'       => $this->attributes ?? [],
            'status'           => $this->status,
            'expiry_date'      => $this->getExpiryDate()?->toDateString(),
            'days_until_expiry'=> $this->daysUntilExpiry(),
            'is_expired'       => $this->isExpired(),
            'is_depleted'      => $this->isDepleted(),
            'created_at'       => $this->created_at?->toIso8601String(),
            'updated_at'       => $this->updated_at?->toIso8601String(),

            // Conditional relations
            'product'  => $this->whenLoaded('product', fn () => new ProductResource($this->product)),
            'variant'  => $this->whenLoaded('variant', fn () => new ProductVariantResource($this->variant)),
        ];
    }
}
