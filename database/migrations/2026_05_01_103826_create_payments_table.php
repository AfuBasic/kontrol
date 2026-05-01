<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('estate_id')->constrained()->onDelete('cascade');
            $table->foreignId('collection_assignment_id')->nullable()->constrained()->onDelete('set null');
            $table->unsignedBigInteger('amount');
            $table->string('provider')->default('paystack');
            $table->string('reference')->unique();
            $table->string('status')->default('initiated'); // initiated, success, failed
            $table->timestamp('paid_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
