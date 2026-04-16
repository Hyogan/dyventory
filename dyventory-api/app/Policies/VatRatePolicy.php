<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\VatRate;

/**
 * VAT rate permissions.
 *  - All authenticated users: view (needed for product forms)
 *  - Admin only: create, update, delete
 */
class VatRatePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, VatRate $vatRate): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    public function update(User $user, VatRate $vatRate): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    public function delete(User $user, VatRate $vatRate): bool
    {
        return $user->hasRole(UserRole::Admin);
    }
}
