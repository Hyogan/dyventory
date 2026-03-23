<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('type'); // percentage, fixed_value, bundle
            $table->decimal('value', 10, 2); // % or fixed amount
            $table->jsonb('conditions')->default('{}'); // min_quantity, category_id, product_id, etc.
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
 
            $table->index('is_active');
            $table->index(['starts_at', 'ends_at']);
        });
 
        Schema::create('losses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();
            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();
            $table->foreignId('batch_id')
                ->nullable()
                ->constrained('batches')
                ->nullOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();
 
            // accidental_damage, theft, expiry, mortality, deterioration
            $table->string('reason');
            $table->decimal('quantity', 10, 3); // positive value, always a loss
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->decimal('total_cost', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
 
            $table->index('product_id');
            $table->index('reason');
            $table->index('occurred_at');
        });
 
        // Write-only audit trail — no delete interface
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
 
            $table->string('action'); // created, updated, deleted, login, logout, etc.
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at');
 
            $table->index('user_id');
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('action');
            $table->index('created_at');
        });
 
        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
 
        Schema::create('inventory_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();
 
            $table->string('status')->default('in_progress'); // in_progress, completed, cancelled
            $table->jsonb('snapshot')->default('{}'); // Stock levels at session start
            $table->jsonb('counts')->default('{}');   // User-submitted counts
            $table->jsonb('discrepancies')->default('{}');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
 
            $table->index('status');
        });
 
        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('inventory_sessions');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('losses');
        Schema::dropIfExists('promotions');
    }
};