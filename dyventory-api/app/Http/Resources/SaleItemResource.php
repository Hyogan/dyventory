<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'product_id'      => $this->product_id,
            'variant_id'      => $this->variant_id,
            'batch_id'        => $this->batch_id,
            'product'         => $this->whenLoaded('product', fn () => [
                'id'   => $this->product->id,
                'name' => $this->product->name,
                'sku'  => $this->product->sku,
                'unit_of_measure' => $this->product->unit_of_measure,
            ]),
            'quantity'        => (float) $this->quantity,
            'unit_price_ht'   => (float) $this->unit_price_ht,
            'unit_price_ttc'  => (float) $this->unit_price_ttc,
            'vat_rate'        => (float) $this->vat_rate,
            'discount_percent' => (float) $this->discount_percent,
            'line_total_ttc'  => (float) $this->line_total_ttc,
        ];
    }
}
