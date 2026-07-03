<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estate_transaction_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->text('reason')->nullable();
            $table->json('previous_values')->nullable();
            $table->json('current_values')->nullable();
            $table->timestamps();

            $table->index(['estate_transaction_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_transaction_audits');
    }
};
