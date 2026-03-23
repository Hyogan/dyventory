<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('category_id')
                ->constrained('categories')
                ->restrictOnDelete();
            $table->foreignId('vat_rate_id')
                ->constrained('vat_rates')
                ->restrictOnDelete();

            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->string('unit_of_measure', 20)->default('piece'); // piece, kg, g, litre, etc.
            $table->decimal('price_buy_ht', 12, 2)->default(0);      // Purchase price excl. tax
            $table->decimal('price_sell_ttc', 12, 2)->default(0);    // Selling price incl. tax
            $table->string('barcode')->nullable()->unique();
            $table->decimal('stock_alert_threshold', 10, 3)->default(0); // decimal for kg support
            $table->boolean('has_variants')->default(false);
            // Values for product-level category fields (applies_to: 'product')
            $table->jsonb('attributes')->default('{}');
            // Up to 5 image paths
            $table->jsonb('images')->default('[]');
            $table->string('status')->default('active'); // App\Enums\ProductStatus
            $table->timestamps();
            $table->softDeletes();

            $table->index('category_id');
            $table->index('status');
            $table->index('sku');
            $table->index('barcode');
        });

        Schema::create('product_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();
            $table->string('sku_variant')->unique();
            $table->string('barcode_variant')->nullable()->unique();
            // Free-form variant attributes e.g. {"size": "M", "colour": "Red"}
            $table->jsonb('attributes_variant')->default('{}');
            $table->decimal('stock_alert_threshold', 10, 3)->default(0);
            $table->decimal('price_override_ttc', 12, 2)->nullable(); // null = use product price
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
    }
};
