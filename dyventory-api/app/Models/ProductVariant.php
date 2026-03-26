<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


#[Fillable([
    'product_id',
    'sku_variant',
    'barcode_variant',
    'attributes_variant',
    'stock_alert_threshold',
    'price_override_ttc',
    'is_active',
])]
class ProductVariant extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'attributes_variant'    => 'array',
            'stock_alert_threshold' => 'decimal:3',
            'price_override_ttc'    => 'decimal:2',
            'is_active'             => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
