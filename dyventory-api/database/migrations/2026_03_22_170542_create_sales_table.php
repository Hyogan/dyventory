<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_id')
                ->nullable()
                ->constrained('clients')
                ->nullOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('sale_number')->unique(); // e.g. INV-2025-0001
            $table->string('status')->default('draft');         // App\Enums\SaleStatus
            $table->string('payment_status')->default('pending'); // App\Enums\PaymentStatus
            $table->string('payment_method')->nullable(); // cash, mobile_money, bank_transfer, credit

            $table->decimal('subtotal_ht', 12, 2)->default(0);
            $table->decimal('total_vat', 12, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('amount_due', 12, 2)->default(0);

            $table->timestamp('due_date')->nullable(); // For credit sales
            $table->text('notes')->nullable();
            $table->string('invoice_path')->nullable();
            $table->string('delivery_note_path')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('client_id');
            $table->index('status');
            $table->index('payment_status');
            $table->index('created_at');
        });

        Schema::create('sale_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sale_id')
                ->constrained('sales')
                ->cascadeOnDelete();
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

            $table->decimal('quantity', 10, 3);         // decimal for kg support
            $table->decimal('unit_price_ht', 12, 2);
            $table->decimal('unit_price_ttc', 12, 2);
            $table->decimal('vat_rate', 5, 2);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('line_total_ttc', 12, 2);
            $table->timestamps();

            $table->index('sale_id');
            $table->index('product_id');
        });

        Schema::create('sale_returns', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sale_id')
                ->constrained('sales')
                ->restrictOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('reason');
            $table->string('resolution'); // refund, credit_note, exchange
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->boolean('restock')->default(false);
            $table->jsonb('items')->default('[]'); // [{product_id, quantity, batch_id}]
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('sale_id');
        });

        Schema::create('sale_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sale_id')
                ->constrained('sales')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->decimal('amount', 12, 2);
            $table->string('payment_method');
            $table->string('reference')->nullable(); // transaction reference
            $table->text('notes')->nullable();
            $table->timestamp('paid_at');
            $table->timestamps();

            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
        Schema::dropIfExists('sale_returns');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
