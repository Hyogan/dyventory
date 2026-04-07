<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Audit log entries are write-only and immutable.
 * No delete or update methods are available on this model.
 *
 * @property int         $id
 * @property int         $user_id
 * @property string      $action
 * @property string|null $entity_type
 * @property int|null    $entity_id
 * @property array|null  $old_values
 * @property array|null  $new_values
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string|null $route
 * @property string      $http_method
 * @property int         $status_code
 * @property \Carbon\Carbon $created_at
 */
#[Fillable([
    'user_id',
    'action',
    'entity_type',
    'entity_id',
    'old_values',
    'new_values',
    'ip_address',
    'user_agent',
    'route',
    'http_method',
    'status_code',
])]
class AuditLog extends Model
{
    /**
     * Audit logs have no updated_at column — they are created once and never touched.
     */
    public const UPDATED_AT = null; // write-only, no updated_at
    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'entity_id' => 'integer',
            'status_code' => 'integer',
            'created_at' => 'datetime'
        ];
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


    // ─────────────────────────────────────────────
    // Immutability Guards
    // ─────────────────────────────────────────────

    /**
     * @throws LogicException — audit logs are immutable.
     */
    public function update(array $attributes = [], array $options = []): bool
    {
        throw new \LogicException('Audit log entries are immutable and cannot be updated.');
    }

    /**
     * Prevent deletion of audit log records.
     * @throws LogicException — audit logs are immutable.
     */
    public function delete(): bool|null
    {
        throw new \LogicException('Audit log entries are immutable and cannot be deleted.');
    }

    /**
     * Prevent force-deletion of audit log records.
     * @throws LogicException — audit logs are immutable.
     */
    public function forceDelete(): bool|null
    {
        throw new \LogicException('Audit log entries are immutable and cannot be deleted.');
    }
}
