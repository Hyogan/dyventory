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
    'contact_person',
    'lead_time_days',
    'minimum_order_amount',
    'notes',
    'is_active'
])]
class Supplier extends Model
{
    use HasFactory, SoftDeletes;
    protected function casts(): array
    {
        return ['minimum_order_amount' => 'decimal:2', 'is_active' => 'boolean', 'lead_time_days' => 'integer'];
    }
    public function orders(): HasMany
    {
        return $this->hasMany(SupplierOrder::class);
    }
    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }
    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }
}
