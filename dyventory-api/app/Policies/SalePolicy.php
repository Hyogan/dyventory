<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Sale;
use App\Models\User;

class SalePolicy
{
    /** Admin · Manager · Vendor · Accountant can list sales. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Vendor · Accountant can view a single sale. */
    public function view(User $user, Sale $sale): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Vendor can create a sale. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
        ]);
    }

    /** Admin · Manager can cancel a sale. */
    public function cancel(User $user, Sale $sale): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin · Manager can process a return or refund. */
    public function processReturn(User $user, Sale $sale): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }

    /** Admin · Manager · Vendor · Accountant can record a credit payment. */
    public function recordPayment(User $user, Sale $sale): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Vendor · Accountant can generate invoice PDFs. */
    public function generateInvoice(User $user, Sale $sale): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager can manage promotions. */
    public function managePromotions(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }
}
