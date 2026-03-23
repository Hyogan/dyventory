<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();
            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();
            $table->foreignId('supplier_id')
                ->nullable()
                ->constrained('suppliers')
                ->nullOnDelete();

            $table->string('batch_number')->nullable();
            $table->timestamp('received_at');
            // decimal(10,3) to support kg precision for snails
            $table->decimal('initial_quantity', 10, 3);
            $table->decimal('current_quantity', 10, 3);
            // Values for batch-level category fields (applies_to: 'batch')
            // e.g. {"expiry_date": "2025-06-30", "lot_number": "LOT-001"}
            $table->jsonb('attributes')->default('{}');
            $table->string('status')->default('active'); // active, depleted, expired
            $table->timestamps();

            $table->index('product_id');
            $table->index('variant_id');
            $table->index('status');
            $table->index('received_at');
            // Composite index for FEFO queries
            $table->index(['product_id', 'status', 'received_at']);
        });

        Schema::create('stock_movements', function (Blueprint $table): void {
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

            $table->string('type'); // App\Enums\MovementType
            // Positive = entry, negative = exit
            $table->decimal('quantity', 10, 3);
            // Polymorphic reference (Sale, SupplierOrder, InventorySession, etc.)
            $table->nullableMorphs('reference');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('product_id');
            $table->index('type');
            $table->index('created_at');
            $table->index(['product_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('batches');
    }
};
