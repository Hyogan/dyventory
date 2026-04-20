<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Promotion;
use App\Models\User;

class PromotionPolicy
{
    /** Admin, Manager, Vendor can list promotions (vendors need to see active ones). */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager, UserRole::Vendor]);
    }

    public function view(User $user, Promotion $promotion): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager, UserRole::Vendor]);
    }

    /** Only Admin and Manager can create/edit/delete promotions. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    public function update(User $user, Promotion $promotion): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    public function delete(User $user, Promotion $promotion): bool
    {
        return $user->hasRole(UserRole::Admin);
    }
}
