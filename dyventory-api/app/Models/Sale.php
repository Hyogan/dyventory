<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'client_id',
    'user_id',
    'sale_number',
    'status',
    'payment_status',
    'payment_method',
    'subtotal_ht',
    'total_vat',
    'total_ttc',
    'discount_amount',
    'amount_paid',
    'amount_due',
    'due_date',
    'notes',
    'invoice_path',
    'delivery_note_path',
])]
class Sale extends Model
{
    use HasFactory, SoftDeletes;


    protected function casts(): array
    {
        return [
            'status'         => SaleStatus::class,
            'payment_status' => PaymentStatus::class,
            'subtotal_ht'    => 'decimal:2',
            'total_vat'      => 'decimal:2',
            'total_ttc'      => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'amount_paid'    => 'decimal:2',
            'amount_due'     => 'decimal:2',
            'due_date'       => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }
    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }
    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where('status', SaleStatus::Confirmed->value);
    }
}
