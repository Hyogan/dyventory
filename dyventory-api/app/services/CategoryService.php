<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Flat list of all categories, parent name and children count included.
     * Used by list/table views.
     *
     * @return Collection<int, Category>
     */
    public function getAll(): Collection
    {
        return Category::with('parent')
            ->withCount('children')
            ->ordered()
            ->get();
    }

    /**
     * Hierarchical tree: root categories with children and grandchildren loaded.
     * Max 3 levels — sufficient for UI dropdowns and sidebar navigation.
     *
     * @return Collection<int, Category>
     */
    public function getTree(): Collection
    {
        return Category::with(['children.children'])
            ->withCount('children')
            ->roots()
            ->ordered()
            ->get();
    }

    /**
     * Find a single category with parent, children, and counts loaded.
     */
    public function find(int $id): Category
    {
        return Category::with(['parent', 'children'])
            ->withCount(['children', 'products'])
            ->findOrFail($id);
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    /**
     * Create a new category. Slug is auto-generated from name if not provided.
     */
    public function create(array $data): Category
    {
        $data['slug']         = $this->uniqueSlug($data['name'], $data['slug'] ?? null);
        $data['field_schema'] ??= [];

        return Category::create($data);
    }

    /**
     * Update category metadata. Field schema is intentionally excluded here —
     * use updateFieldSchema() for schema changes so key-immutability is enforced.
     */
    public function update(Category $category, array $data): Category
    {
        unset($data['field_schema']); // never via this method

        if (isset($data['name']) && $data['name'] !== $category->name && ! isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], null, $category->id);
        } elseif (isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'] ?? $category->name, $data['slug'], $category->id);
        }

        $category->update($data);

        return $category->fresh(['parent', 'children']);
    }

    /**
     * Replace the field schema for a category.
     *
     * Enforces key immutability: once a field key exists in the schema it may
     * not be removed or renamed. Labels, options, required, and applies_to
     * can be changed freely.
     *
     * @param  array<int, array<string, mixed>>  $schema  Validated schema payload
     *
     * @throws \Illuminate\Validation\ValidationException when existing keys are removed
     */
    public function updateFieldSchema(Category $category, array $schema): Category
    {
        $existingKeys = collect($category->field_schema ?? [])->pluck('key')->all();

        if (! empty($existingKeys)) {
            $newKeys = collect($schema)->pluck('key')->all();

            foreach ($existingKeys as $existingKey) {
                if (! in_array($existingKey, $newKeys, true)) {
                    throw ValidationException::withMessages([
                        'schema' => [
                            "Field key '{$existingKey}' cannot be removed once created. "
                            . 'Field keys are immutable — rename the label instead.',
                        ],
                    ]);
                }
            }
        }

        $category->update(['field_schema' => $schema]);

        return $category->fresh();
    }

    /**
     * Delete a category.
     *
     * @throws \Illuminate\Validation\ValidationException when the category has children or products
     */
    public function delete(Category $category): void
    {
        if ($category->children()->exists()) {
            throw ValidationException::withMessages([
                'category' => ['Cannot delete a category that has sub-categories. Move or delete them first.'],
            ]);
        }

        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => ['Cannot delete a category that has products assigned to it.'],
            ]);
        }

        $category->delete();
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Generate a unique slug from a name, optionally excluding $excludeId
     * so that updating a category doesn't conflict with itself.
     */
    private function uniqueSlug(string $name, ?string $base = null, ?int $excludeId = null): string
    {
        $slug     = Str::slug($base ?? $name);
        $original = $slug;
        $counter  = 1;

        while (
            Category::where('slug', $slug)
                ->when($excludeId !== null, fn ($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
