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
        Schema::create('collection_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->onDelete('cascade');
            $table->foreignId('estate_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('period')->nullable(); // YYYY-MM or YYYY for recurring
            $table->unsignedBigInteger('amount_due');
            $table->unsignedBigInteger('amount_paid')->default(0);
            $table->string('status')->default('pending'); // pending, paid, overdue, grace, partial
            $table->date('due_date');
            $table->date('grace_until')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('external_reference')->nullable();
            $table->timestamps();

            $table->unique(['collection_id', 'user_id', 'period'], 'collection_user_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collection_assignments');
    }
};
