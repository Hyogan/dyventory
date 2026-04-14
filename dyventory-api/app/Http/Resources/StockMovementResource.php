<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'product_id'     => $this->product_id,
            'variant_id'     => $this->variant_id,
            'batch_id'       => $this->batch_id,
            'user_id'        => $this->user_id,
            'type'           => $this->type->value,
            'type_label'     => $this->type->label(),
            'is_entry'       => $this->type->isEntry(),
            'is_exit'        => $this->type->isExit(),
            'quantity'       => (float) $this->quantity,
            'notes'          => $this->notes,
            'created_at'     => $this->created_at?->toIso8601String(),

            // Conditional relations
            'product' => $this->whenLoaded('product', fn () => [
                'id'   => $this->product->id,
                'name' => $this->product->name,
                'sku'  => $this->product->sku,
            ]),
            'batch'   => $this->whenLoaded('batch', fn () => new BatchResource($this->batch)),
            'user'    => $this->whenLoaded('user', fn () => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
        ];
    }
}
