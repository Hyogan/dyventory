<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(
    'user_id',
    'action',
    'auditable_type',
    'auditable_id',
    'old_values',
    'new_values',
    'ip_address',
    'user_agent'
)]
class AuditLog extends Model
{
    public const UPDATED_AT = null; // write-only, no updated_at
    protected function casts(): array
    {
        return ['old_values' => 'array', 'new_values' => 'array', 'created_at' => 'datetime'];
    }
    // No delete scope — audit logs are immutable
    public static function boot(): void
    {
        parent::boot();
        static::deleting(fn() => throw new \RuntimeException('Audit logs cannot be deleted.'));
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function scopeForEntity(Builder $q, string $type, int $id): Builder
    {
        return $q->where('auditable_type', $type)->where('auditable_id', $id);
    }
    public function scopeByUser(Builder $q, int $userId): Builder
    {
        return $q->where('user_id', $userId);
    }
}
