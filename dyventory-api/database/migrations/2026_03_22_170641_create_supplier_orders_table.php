<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
      public function up(): void
    {
        Schema::create('supplier_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->restrictOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();
 
            $table->string('order_number')->unique();
            $table->string('status')->default('draft'); // App\Enums\SupplierOrderStatus
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->timestamp('expected_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
 
            $table->index('supplier_id');
            $table->index('status');
        });
 
        Schema::create('supplier_order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('supplier_order_id')
                ->constrained('supplier_orders')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();
            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();
 
            $table->decimal('quantity_ordered', 10, 3);
            $table->decimal('quantity_received', 10, 3)->default(0);
            $table->decimal('unit_price_ht', 12, 2);
            $table->timestamps();
 
            $table->index('supplier_order_id');
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('supplier_order_items');
        Schema::dropIfExists('supplier_orders');
    }
};