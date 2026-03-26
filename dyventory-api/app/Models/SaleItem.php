<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sale_id',
    'product_id',
    'variant_id',
    'batch_id',
    'quantity',
    'unit_price_ht',
    'unit_price_ttc',
    'vat_rate',
    'discount_percent',
    'line_total_ttc'
])]
class SaleItem extends Model
{
    protected function casts(): array
    {
        return ['quantity' => 'decimal:3', 'unit_price_ht' => 'decimal:2', 'unit_price_ttc' => 'decimal:2', 'vat_rate' => 'decimal:2', 'discount_percent' => 'decimal:2', 'line_total_ttc' => 'decimal:2'];
    }
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
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
}
