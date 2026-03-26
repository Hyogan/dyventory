<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name',
    'email',
    'phone',
    'address',
    'type',
    'credit_limit',
    'outstanding_balance',
    'notes',
    'is_active'
])]
class Client extends Model
{
    use HasFactory, SoftDeletes;
    protected function casts(): array
    {
        return ['credit_limit' => 'decimal:2', 'outstanding_balance' => 'decimal:2', 'is_active' => 'boolean'];
    }
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }
    public function scopeSearch(Builder $q, string $term): Builder
    {
        return $q->where(fn(Builder $q) => $q->where('name', 'ilike', "%{$term}%")->orWhere('email', 'ilike', "%{$term}%")->orWhere('phone', 'ilike', "%{$term}%"));
    }
}
