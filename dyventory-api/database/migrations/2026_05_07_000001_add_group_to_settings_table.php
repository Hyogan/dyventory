<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add the group column if it does not already exist
        if (! Schema::hasColumn('settings', 'group')) {
            Schema::table('settings', static function (Blueprint $table): void {
                $table->string('group', 50)->default('general')->after('value');
                $table->index('group');
            });

            // Back-fill groups based on key naming conventions
            $map = [
                'company_name'          => 'company',
                'company_email'         => 'company',
                'company_phone'         => 'company',
                'company_address'       => 'company',
                'company_logo'          => 'company',
                'company_registration'  => 'company',
                'low_stock_threshold'   => 'alerts',
                'expiry_warning_days'   => 'alerts',
                'mortality_alert_enabled' => 'alerts',
                'invoice_prefix'        => 'invoices',
                'invoice_footer'        => 'invoices',
                'invoice_due_days'      => 'invoices',
                'default_currency'      => 'tax',
            ];

            foreach ($map as $key => $group) {
                DB::table('settings')->where('key', $key)->update(['group' => $group]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('settings', 'group')) {
            Schema::table('settings', static function (Blueprint $table): void {
                $table->dropIndex(['group']);
                $table->dropColumn('group');
            });
        }
    }
};
