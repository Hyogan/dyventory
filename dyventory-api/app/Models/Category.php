<?php

declare(strict_types=1);

namespace App\Models;

use App\DTOs\FieldDefinition;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'parent_id',
    'name',
    'slug',
    'description',
    'field_schema',
    'is_active',
    'sort_order',
])]
// #[Hidden([
//     'parent_id',
//     'name',
//     'slug',
//     'description',
//     'field_schema',
//     'is_active',
//     'sort_order',
// ])]
class Category extends Model
{
    protected function casts(): array
    {
        return [
            'field_schema' => 'array',
            'is_active'    => 'boolean',
            'sort_order'   => 'integer',
        ];
    }

    // Relations

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
 
    // Helpers

    /**
     * Returns FieldDefinition DTOs for all fields.
     *
     * @return FieldDefinition[]
     */
    public function getAllFields(): array
    {
        return array_map(
            fn(array $field): FieldDefinition => FieldDefinition::fromArray($field),
            $this->field_schema ?? []
        );
    }

    /**
     * Returns FieldDefinition DTOs filtered by applies_to.
     *
     * @return FieldDefinition[]
     */
    public function getProductFields(): array
    {
        return array_values(array_filter(
            $this->getAllFields(),
            fn(FieldDefinition $f): bool => $f->appliesTo === 'product'
        ));
    }

    /**
     * Returns FieldDefinition DTOs for batch-level fields.
     *
     * @return FieldDefinition[]
     */
    public function getBatchFields(): array
    {
        return array_values(array_filter(
            $this->getAllFields(),
            fn(FieldDefinition $f): bool => $f->appliesTo === 'batch'
        ));
    }

    /**
     * Returns the full ancestor chain as a flat collection.
     *
     * @return Collection<int, Category>
     */
    public function ancestors(): Collection
    {
        $ancestors = new Collection();
        $current   = $this->parent;
        while ($current !== null) {
            $ancestors->prepend($current);
            $current = $current->parent;
        }
        return $ancestors;
    }

    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }

    public function scopeRoots(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->whereNull('parent_id');
    }

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('is_active', true);
    }
}
