<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /** Admin · Manager · Vendor · Warehouse can view the product list. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Vendor · Warehouse can view a single product. */
    public function view(User $user, Product $product): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager can create products. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin · Manager can update products. */
    public function update(User $user, Product $product): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin · Manager can archive / soft-delete products. */
    public function delete(User $user, Product $product): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin · Manager can manage category field schemas. */
    public function manageSchema(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /**
     * Admin · Manager can see financial data on products
     * (purchase price, stock value).  Used in ProductResource to
     * conditionally expose cost fields.
     */
    public function viewFinancials(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }
}
