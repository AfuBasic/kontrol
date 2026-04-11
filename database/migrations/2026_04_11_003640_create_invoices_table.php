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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('estate_id');
            $table->unsignedBigInteger('plan_id');
            $table->string('invoice_number')->unique();
            $table->unsignedBigInteger('amount')->comment('Amount in kobo');
            $table->unsignedInteger('resident_count')->comment('Snapshot of active residents at generation');
            $table->date('billing_period_start');
            $table->date('billing_period_end');
            $table->date('due_date');
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('pending');
            $table->string('paystack_reference')->nullable()->unique();
            $table->string('paystack_access_code')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->foreign('estate_id')->references('id')->on('estates')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('restrict');
            $table->index('estate_id');
            $table->index('status');
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
