<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\User;

/** Admin-only read access to audit logs. */
class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    public function view(User $user, AuditLog $auditLog): bool
    {
        return $user->hasRole(UserRole::Admin);
    }
}
