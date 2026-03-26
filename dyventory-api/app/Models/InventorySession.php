<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'status',
    'snapshot',
    'counts',
    'discrepancies',
    'completed_at'
])]
class InventorySession extends Model
{

    protected function casts(): array
    {
        return ['snapshot' => 'array', 'counts' => 'array', 'discrepancies' => 'array', 'completed_at' => 'datetime'];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }
}
