<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('settings', 'label')) {
            Schema::table('settings', static function (Blueprint $table): void {
                $table->string('label', 255)->nullable()->after('type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('settings', 'label')) {
            Schema::table('settings', static function (Blueprint $table): void {
                $table->dropColumn('label');
            });
        }
    }
};
