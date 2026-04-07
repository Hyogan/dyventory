<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    /** Admin only can list all users. */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    /**
     * Admin can view any user profile.
     * Any user may view their own profile (for the /auth/me endpoint etc.).
     */
    public function view(User $user, User $model): bool
    {
        return $user->hasRole(UserRole::Admin) || $user->id === $model->id;
    }

    /** Admin only can create new users. */
    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    /**
     * Admin can update any user's profile and role.
     * Non-admins cannot change role — enforced separately in the Form Request.
     */
    public function update(User $user, User $model): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    /**
     * Admin can soft-delete users.
     * An admin cannot delete their own account (prevent lockout).
     */
    public function delete(User $user, User $model): bool
    {
        return $user->hasRole(UserRole::Admin) && $user->id !== $model->id;
    }

    /** Admin can restore a soft-deleted user. */
    public function restore(User $user, User $model): bool
    {
        return $user->hasRole(UserRole::Admin);
    }
}
