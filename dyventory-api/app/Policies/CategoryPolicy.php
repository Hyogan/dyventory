<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\User;

/**
 * Permissions matrix (spec §2.1):
 *
 * viewAny / view  → Admin, Manager, Vendor, Warehouse  (everyone who can view products)
 * create          → Admin, Manager
 * update          → Admin, Manager
 * delete          → Admin, Manager
 * manageSchema    → Admin, Manager  (update field_schema specifically)
 */
class CategoryPolicy
{
    /** All roles that interact with products can browse categories. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Warehouse,
        ]);
    }

    public function view(User $user, Category $category): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Warehouse,
        ]);
    }

    /** Admin and Manager can create new categories. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin and Manager can edit category metadata. */
    public function update(User $user, Category $category): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin and Manager can delete categories (service enforces no children/products). */
    public function delete(User $user, Category $category): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin and Manager can modify the field schema of a category. */
    public function manageSchema(User $user, Category $category): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }
}
