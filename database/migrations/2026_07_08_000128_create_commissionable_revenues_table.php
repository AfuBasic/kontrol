<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commissionable_revenues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referrer_id')->constrained('referrers')->cascadeOnDelete();
            $table->foreignId('commission_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('revenue_amount');
            $table->unsignedBigInteger('commission_amount');
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index(['estate_id', 'referrer_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissionable_revenues');
    }
};
