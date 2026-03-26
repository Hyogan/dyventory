<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'product_id',
    'variant_id',
    'batch_id',
    'user_id',
    'type',
    'quantity',
    'reference_id',
    'reference_type',
    'notes',
])]
class StockMovement extends Model
{
    use HasFactory;


    protected function casts(): array
    {
        return [
            'type'     => MovementType::class,
            'quantity' => 'decimal:3',
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

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    // Scopes

    public function scopeEntries(Builder $query): Builder
    {
        return $query->whereIn('type', [
            MovementType::InPurchase->value,
            MovementType::InReturn->value,
        ]);
    }

    public function scopeExits(Builder $query): Builder
    {
        return $query->whereIn('type', [
            MovementType::OutSale->value,
            MovementType::OutLoss->value,
            MovementType::OutExpiry->value,
            MovementType::OutMortality->value,
        ]);
    }

    public function scopeForProduct(Builder $query, int $productId): Builder
    {
        return $query->where('product_id', $productId);
    }
}
