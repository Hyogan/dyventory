<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Batch;
use App\Models\User;

class BatchPolicy
{
    /** Admin · Manager · Warehouse can view batch list. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can view a single batch. */
    public function view(User $user, Batch $batch): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can create batches. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Warehouse can update batches. */
    public function update(User $user, Batch $batch): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }
}
