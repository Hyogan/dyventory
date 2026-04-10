<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Category
 */
class CategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'slug'      => $this->slug,
            'parent_id' => $this->parent_id,

            // Include parent name for breadcrumb display
            'parent' => $this->when(
                $this->relationLoaded('parent') && $this->parent !== null,
                fn() => [
                    'id'   => $this->parent->id,
                    'name' => $this->parent->name,
                ],
            ),

            // Children included when explicitly loaded (tree views)
            'children' => CategoryResource::collection(
                $this->whenLoaded('children'),
            ),

            // Number of direct children — always present
            'children_count' => $this->whenCounted('children'),

            // Full field schema array — this is the critical payload for
            // the frontend form renderer and schema builder.
            'field_schema' => $this->field_schema ?? [],

            // Convenience counts for the UI
            'product_fields_count' => $this->when(
                $this->hasFieldSchema(),
                fn() => $this->getProductFields()->count(),
            ),
            'batch_fields_count' => $this->when(
                $this->hasFieldSchema(),
                fn() => $this->getBatchFields()->count(),
            ),

            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
