<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierOrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $quantityOrdered  = (float) $this->quantity_ordered;
        $quantityReceived = (float) $this->quantity_received;

        return [
            'id'                 => $this->id,

            'product_id'         => $this->product_id,
            'product'            => $this->whenLoaded('product', fn () => [
                'id'   => $this->product->id,
                'name' => $this->product->name,
                'sku'  => $this->product->sku ?? null,
            ]),

            'variant_id'         => $this->variant_id,
            'variant'            => $this->whenLoaded('variant', fn () => $this->variant ? [
                'id'   => $this->variant->id,
                'name' => $this->variant->name,
            ] : null),

            'quantity_ordered'   => $quantityOrdered,
            'quantity_received'  => $quantityReceived,
            'quantity_remaining' => max(0.0, round($quantityOrdered - $quantityReceived, 3)),

            'unit_price_ht'      => (float) $this->unit_price_ht,
            'line_total_ht'      => round($quantityOrdered * (float) $this->unit_price_ht, 2),
        ];
    }
}
