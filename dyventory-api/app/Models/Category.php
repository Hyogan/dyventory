<?php

declare(strict_types=1);

namespace App\Models;

use App\DTOs\FieldDefinition;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection as BaseCollection;

/**
 * @property int                        $id
 * @property string                     $name
 * @property string                     $slug
 * @property string|null                $description
 * @property int|null                   $parent_id
 * @property array                      $field_schema   Raw JSONB array of field definitions
 * @property bool                       $is_active
 * @property int                        $sort_order
 * @property \Carbon\Carbon             $created_at
 * @property \Carbon\Carbon             $updated_at
 * @property Category|null             $parent
 * @property Collection<int, Category> $children
 * @property Collection<int, Product>  $products
 */
#[Fillable([
    'parent_id',
    'name',
    'slug',
    'description',
    'field_schema',
    'is_active',
    'sort_order',
])]
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

    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────

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

    // ─────────────────────────────────────────────
    // Field Schema Helpers
    // ─────────────────────────────────────────────

    /**
     * Return the full field schema as a typed collection of FieldDefinition DTOs.
     *
     * @return BaseCollection<int, FieldDefinition>
     */
    public function getFieldDefinitions(): BaseCollection
    {
        return collect($this->field_schema ?? [])
            ->map(fn (array $raw): FieldDefinition => FieldDefinition::fromArray($raw));
    }

    /**
     * Return fields that appear on the product form (applies_to = 'product').
     *
     * @return BaseCollection<int, FieldDefinition>
     */
    public function getProductFields(): BaseCollection
    {
        return $this->getFieldDefinitions()
            ->filter(fn (FieldDefinition $f): bool => $f->appliesToProduct())
            ->values();
    }

    /**
     * Return fields that appear on the batch/lot form (applies_to = 'batch').
     *
     * @return BaseCollection<int, FieldDefinition>
     */
    public function getBatchFields(): BaseCollection
    {
        return $this->getFieldDefinitions()
            ->filter(fn (FieldDefinition $f): bool => $f->appliesToBatch())
            ->values();
    }

    /**
     * Whether this category has any custom fields defined.
     */
    public function hasFieldSchema(): bool
    {
        return ! empty($this->field_schema);
    }

    // ─────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────

    /** Only top-level categories (no parent). */
    public function scopeRoots(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    /** Order alphabetically by name. */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('name');
    }

    /** Only active categories. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }

    /**
     * Return the full ancestor chain as a flat collection (nearest first).
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
}
