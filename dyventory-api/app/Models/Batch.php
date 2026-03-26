<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'product_id',
    'variant_id',
    'supplier_id',
    'batch_number',
    'received_at',
    'initial_quantity',
    'current_quantity',
    'attributes',
    'status',
])]
class Batch extends Model
{
    use HasFactory;


    protected function casts(): array
    {
        return [
            'received_at'      => 'datetime',
            'initial_quantity' => 'decimal:3',
            'current_quantity' => 'decimal:3',
            'attributes'       => 'array',
        ];
    }

    // Relations

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    // Scopes

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')->where('current_quantity', '>', 0);
    }

    /** FEFO — order by expiry date from batch attributes, fallback to received_at */
    public function scopeFefo(Builder $query): Builder
    {
        return $query->active()
            ->orderByRaw("(attributes->>'expiry_date')::date ASC NULLS LAST")
            ->orderBy('received_at', 'asc');
    }

    // Helpers

    public function isDepleted(): bool
    {
        return (float) $this->current_quantity <= 0;
    }

    public function getExpiryDate(): ?\Carbon\Carbon
    {
        $expiry = $this->attributes['expiry_date'] ?? null;
        return $expiry ? \Carbon\Carbon::parse($expiry) : null;
    }

    public function isExpired(): bool
    {
        $expiry = $this->getExpiryDate();
        return $expiry !== null && $expiry->isPast();
    }

    public function daysUntilExpiry(): ?int
    {
        $expiry = $this->getExpiryDate();
        return $expiry ? (int) now()->diffInDays($expiry, false) : null;
    }
}
