<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'supplier_order_id',
    'product_id',
    'variant_id',
    'quantity_ordered',
    'quantity_received',
    'unit_price_ht'
])]
class SupplierOrderItem extends Model
{
    protected function casts(): array
    {
        return ['quantity_ordered' => 'decimal:3', 'quantity_received' => 'decimal:3', 'unit_price_ht' => 'decimal:2'];
    }
    public function order(): BelongsTo
    {
        return $this->belongsTo(SupplierOrder::class, 'supplier_order_id');
    }
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
