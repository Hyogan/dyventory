<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\StockMovement;
use App\Models\User;

class StockMovementPolicy
{
    /** Admin · Manager · Warehouse can view movement history. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can view a single movement. */
    public function view(User $user, StockMovement $movement): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can record movements. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }
}
