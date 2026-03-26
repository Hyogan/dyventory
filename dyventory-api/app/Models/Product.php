<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\AsCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'category_id',
    'vat_rate_id',
    'name',
    'sku',
    'description',
    'unit_of_measure',
    'price_buy_ht',
    'price_sell_ttc',
    'barcode',
    'stock_alert_threshold',
    'has_variants',
    'attributes',
    'images',
    'status',
])]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'price_buy_ht'          => 'decimal:2',
            'price_sell_ttc'        => 'decimal:2',
            'stock_alert_threshold' => 'decimal:3',
            'has_variants'          => 'boolean',
            'attributes'            => 'array',
            'images'                => 'array',
        ];
    }

    // Relations

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function vatRate(): BelongsTo
    {
        return $this->belongsTo(VatRate::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    // Scopes

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeInCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereRaw('stock_alert_threshold > 0')
            ->whereHas('batches', function (Builder $q): void {
                $q->where('status', 'active');
            }, '<', 1)
            ->orWhereRaw(
                '(SELECT COALESCE(SUM(current_quantity),0) FROM batches WHERE batches.product_id = products.id AND batches.status = ?) <= stock_alert_threshold',
                ['active']
            );
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term): void {
            $q->where('name', 'ilike', "%{$term}%")
                ->orWhere('sku', 'ilike', "%{$term}%")
                ->orWhere('barcode', 'ilike', "%{$term}%");
        });
    }

    // Computed

    /**
     * Get current total stock across all active batches.
     */
    public function getCurrentStockAttribute(): float
    {
        return (float) $this->batches()
            ->where('status', 'active')
            ->sum('current_quantity');
    }

    public function isLivingProduct(): bool
    {
        return in_array($this->unit_of_measure, ['kg', 'g'], true);
    }
}
