<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sale_id',
    'user_id',
    'reason',
    'resolution',
    'refund_amount',
    'restock',
    'items',
    'notes'
])]
class SaleReturn extends Model
{
    protected function casts(): array
    {
        return ['refund_amount' => 'decimal:2', 'restock' => 'boolean', 'items' => 'array'];
    }
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
