<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Promotion */
class PromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'type'           => $this->type,
            'value'          => $this->value,
            'discount_label' => $this->discount_label,
            'conditions'     => $this->conditions ?? [],
            'starts_at'      => $this->starts_at?->toIso8601String(),
            'ends_at'        => $this->ends_at?->toIso8601String(),
            'is_active'      => $this->is_active,
            'is_running'     => $this->isCurrentlyActive(),
            'created_at'     => $this->created_at->toIso8601String(),
            'updated_at'     => $this->updated_at->toIso8601String(),
        ];
    }
}
