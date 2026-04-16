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
        Schema::create('settings', static function (Blueprint $table): void {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->string('type', 20)->default('string'); // string | integer | float | boolean | json
            $table->string('label', 255)->nullable();
            $table->timestamps();

            $table->index('group');
        });

        // Seed default settings
        $now = now();

        DB::table('settings')->insert([
            // ── Company ──────────────────────────────────────────────────────────
            ['key' => 'company_name',          'value' => null,    'group' => 'company',  'type' => 'string',  'label' => 'Company Name',            'created_at' => $now, 'updated_at' => $now],
            ['key' => 'company_email',         'value' => null,    'group' => 'company',  'type' => 'string',  'label' => 'Company Email',           'created_at' => $now, 'updated_at' => $now],
            ['key' => 'company_phone',         'value' => null,    'group' => 'company',  'type' => 'string',  'label' => 'Company Phone',           'created_at' => $now, 'updated_at' => $now],
            ['key' => 'company_address',       'value' => null,    'group' => 'company',  'type' => 'string',  'label' => 'Company Address',         'created_at' => $now, 'updated_at' => $now],
            ['key' => 'company_logo',          'value' => null,    'group' => 'company',  'type' => 'string',  'label' => 'Logo Path',               'created_at' => $now, 'updated_at' => $now],
            ['key' => 'company_registration',  'value' => null,    'group' => 'company',  'type' => 'string',  'label' => 'Registration Number',     'created_at' => $now, 'updated_at' => $now],

            // ── Alerts ───────────────────────────────────────────────────────────
            ['key' => 'low_stock_threshold',     'value' => '10',   'group' => 'alerts',   'type' => 'integer', 'label' => 'Low Stock Threshold',         'created_at' => $now, 'updated_at' => $now],
            ['key' => 'expiry_warning_days',     'value' => '30',   'group' => 'alerts',   'type' => 'integer', 'label' => 'Expiry Warning (days)',        'created_at' => $now, 'updated_at' => $now],
            ['key' => 'mortality_alert_enabled', 'value' => 'true', 'group' => 'alerts',   'type' => 'boolean', 'label' => 'Mortality Alert Enabled',      'created_at' => $now, 'updated_at' => $now],

            // ── Invoices ─────────────────────────────────────────────────────────
            ['key' => 'invoice_prefix',   'value' => 'INV',  'group' => 'invoices', 'type' => 'string',  'label' => 'Invoice Number Prefix',    'created_at' => $now, 'updated_at' => $now],
            ['key' => 'invoice_footer',   'value' => null,   'group' => 'invoices', 'type' => 'string',  'label' => 'Invoice Footer Note',      'created_at' => $now, 'updated_at' => $now],
            ['key' => 'invoice_due_days', 'value' => '30',   'group' => 'invoices', 'type' => 'integer', 'label' => 'Default Credit Due (days)','created_at' => $now, 'updated_at' => $now],

            // ── Tax / Currency ────────────────────────────────────────────────────
            ['key' => 'default_currency', 'value' => 'XOF',  'group' => 'tax',      'type' => 'string',  'label' => 'Default Currency',         'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
