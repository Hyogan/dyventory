<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Supplier;
use App\Models\User;

class SupplierPolicy
{
    /** Admin · Manager · Warehouse can list suppliers. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can view a single supplier. */
    public function view(User $user, Supplier $supplier): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can create suppliers. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can update suppliers. */
    public function update(User $user, Supplier $supplier): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin only can delete suppliers. */
    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    /** Admin · Manager · Warehouse can manage supplier orders. */
    public function manageOrders(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }
}
