<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SupplierOrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(
    'supplier_id',
    'user_id',
    'order_number',
    'status',
    'total_amount',
    'expected_at',
    'received_at',
    'notes'
)]
class SupplierOrder extends Model
{
    use HasFactory, SoftDeletes;
    protected function casts(): array
    {
        return ['status' => SupplierOrderStatus::class, 'total_amount' => 'decimal:2', 'expected_at' => 'datetime', 'received_at' => 'datetime'];
    }
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function items(): HasMany
    {
        return $this->hasMany(SupplierOrderItem::class);
    }
}
