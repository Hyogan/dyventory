<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sale_id',
    'user_id',
    'amount',
    'payment_method',
    'reference',
    'notes',
    'paid_at'
])]
class SalePayment extends Model
{
    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'paid_at' => 'datetime'];
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
