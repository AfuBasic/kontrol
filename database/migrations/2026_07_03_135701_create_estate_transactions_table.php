<?php

use App\Enums\PaymentMethod;
use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estate_transactions', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('estate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('collection_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('collection_assignment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('estate_transactions')->nullOnDelete();
            $table->enum('type', array_column(TransactionType::cases(), 'value'));
            $table->enum('direction', array_column(TransactionDirection::cases(), 'value'));
            $table->unsignedBigInteger('amount');
            $table->string('currency', 3)->default('NGN');
            $table->enum('status', array_column(TransactionStatus::cases(), 'value'))->default(TransactionStatus::Pending->value);
            $table->enum('payment_method', array_column(PaymentMethod::cases(), 'value'))->nullable();
            $table->string('provider')->nullable();
            $table->string('reference_number')->unique();
            $table->string('gateway_reference')->nullable();
            $table->string('receipt_number')->nullable();
            $table->string('description')->nullable();
            $table->text('reason')->nullable();
            $table->string('coupon_code')->nullable();
            $table->json('metadata')->nullable();
            $table->json('gateway_response')->nullable();
            $table->nullableMorphs('source');
            $table->string('idempotency_key')->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->timestamps();

            $table->index(['estate_id', 'created_at']);
            $table->index(['estate_id', 'status']);
            $table->index(['estate_id', 'type']);
            $table->index(['estate_id', 'direction']);
            $table->index('gateway_reference');
            $table->index('coupon_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_transactions');
    }
};
