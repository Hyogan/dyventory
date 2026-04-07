<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    /** Admin · Manager · Vendor · Accountant can list clients. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Vendor · Accountant can view a single client. */
    public function view(User $user, Client $client): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Vendor can create clients. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
        ]);
    }

    /** Admin · Manager · Vendor can update clients. */
    public function update(User $user, Client $client): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
        ]);
    }

    /** Admin only can delete clients. */
    public function delete(User $user, Client $client): bool
    {
        return $user->hasRole(UserRole::Admin);
    }
}
