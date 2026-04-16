<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Setting;
use App\Models\User;

/**
 * Settings permissions — admin-only read and write.
 */
class SettingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    public function update(User $user): bool
    {
        return $user->hasRole(UserRole::Admin);
    }
}
