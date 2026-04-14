<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\InventorySession;
use App\Models\User;

class InventorySessionPolicy
{
    /** Admin · Manager · Warehouse can start inventory sessions. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can view any session. */
    public function view(User $user, InventorySession $session): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Only Admin · Manager can validate/cancel (write results). */
    public function update(User $user, InventorySession $session): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }
}
