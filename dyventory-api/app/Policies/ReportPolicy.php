<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

/**
 * Gates for reports and analytics.
 *
 * Not model-bound — registered as named gates in AppServiceProvider.
 * Mirrors the permissions matrix in specifications.md section 2.1 exactly.
 */
class ReportPolicy
{
    /** All roles can view the main dashboard. */
    public function viewDashboard(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Vendor,
            UserRole::Warehouse,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Accountant can view sales reports. */
    public function viewSalesReports(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Warehouse can view stock reports. */
    public function viewStockReports(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Accountant can view TVA / tax reports. */
    public function viewTvaReports(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Accountant can view credit / debt reports. */
    public function viewCreditReports(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Accountant,
        ]);
    }

    /** Admin · Manager · Warehouse can view loss reports. */
    public function viewLossReports(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Warehouse,
        ]);
    }

    /** Admin · Manager · Accountant can export reports to PDF / Excel. */
    public function export(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin,
            UserRole::Manager,
            UserRole::Accountant,
        ]);
    }

    /** Admin only can view the audit trail. */
    public function viewAuditTrail(User $user): bool
    {
        return $user->hasRole(UserRole::Admin);
    }

    /** Admin · Manager can configure alert thresholds. */
    public function configureAlerts(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin, UserRole::Manager]);
    }
}
