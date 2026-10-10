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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->date('incurred_on');
            // Kobo, like every other money column in the app.
            $table->unsignedBigInteger('amount');
            $table->foreignId('expense_category_id')->constrained('expense_categories')->restrictOnDelete();
            $table->string('payee', 150);
            $table->text('note')->nullable();
            // Free text only (for example "USD 20"); there is no exchange-rate logic.
            $table->string('original_amount_note', 60)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['incurred_on', 'id']);
            $table->index('expense_category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
