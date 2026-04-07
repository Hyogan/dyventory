<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
// use Illuminate\Database\Eloquent\Attributes\Fillable;
// use Illuminate\Database\Eloquent\Attributes\Hidden;

use Illuminate\Database\Eloquent\Attributes\{Table, Fillable, Hidden, Casts};
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Laravel\Sanctum\HasApiTokens;

// #[Fillable([
//     'name',
//     'email',
//     'password',
//     'role',
//     'phone',
//     'is_active',
// ])]
// #[Hidden(['password', 'remember_token'])]


/**
 * @property int       $id
 * @property string    $name
 * @property string    $email
 * @property UserRole  $role
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'phone', 'is_active'])]
#[Hidden(['password', 'remember_token'])]

// #[Casts('email_verified_at', 'datetime')]
// #[Casts('password', 'hashed')]
// #[Casts('deleted_at', 'datetime')]

// #[Casts('role', UserRole::class)]
#[UseFactory(UserFactory::class)]
class User extends Authenticatable
{

    /** @use HasFactory<UserFactory> */
    use  HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'role'              => UserRole::class,
            'is_active'         => 'boolean',
            'deleted_at'        => 'datetime',
        ];
    }

    


    // public function hasRole(UserRole|string $role): bool
    // {
    //     $roleValue = $role instanceof UserRole ? $role->value : $role;
    //     return $this->role->value === $roleValue;
    // }

    // /**
    //  * @param (UserRole|string)[] $roles
    //  */
    // public function hasAnyRole(array $roles): bool
    // {
    //     $roleValues = array_map(
    //         fn(UserRole|string $r): string => $r instanceof UserRole ? $r->value : $r,
    //         $roles
    //     );
    //     return in_array($this->role->value, $roleValues, true);
    // }


        // ─────────────────────────────────────────────
    // Role Helpers
    // ─────────────────────────────────────────────

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if the user has any of the given roles.
     *
     * @param array<UserRole> $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles, true);
    }


    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(UserRole::Admin);
    }
}
