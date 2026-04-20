<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name',
    'type',
    'value',
    'conditions',
    'starts_at',
    'ends_at',
    'is_active',
])]
class Promotion extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'value'      => 'decimal:2',
            'conditions' => 'array',
            'starts_at'  => 'datetime',
            'ends_at'    => 'datetime',
            'is_active'  => 'boolean',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now());
    }

    public function scopeSearch(Builder $q, string $term): Builder
    {
        return $q->where('name', 'ilike', "%{$term}%");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Human-readable label for the discount value. */
    public function getDiscountLabelAttribute(): string
    {
        return match ($this->type) {
            'percentage'  => "{$this->value}%",
            'fixed_value' => number_format((float) $this->value, 0, ',', ' ') . ' F',
            default       => (string) $this->value,
        };
    }

    public function isCurrentlyActive(): bool
    {
        return $this->is_active
            && $this->starts_at <= now()
            && $this->ends_at   >= now();
    }
}
