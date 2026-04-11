<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignId('estate_id')->constrained('estates')->onDelete('cascade');
            $table->string('paystack_reference')->unique()->index();
            $table->string('idempotency_key')->unique()->index();
            $table->unsignedBigInteger('amount')->comment('Amount in kobo');
            $table->string('currency')->default('NGN');
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending')->index();
            $table->string('payment_method')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->unsignedTinyInteger('attempt_count')->default(1);
            $table->json('metadata')->nullable()->comment('Additional payment data from Paystack');
            $table->timestamps();

            // Indexes for common queries
            $table->index(['estate_id', 'created_at']);
            $table->index(['invoice_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
