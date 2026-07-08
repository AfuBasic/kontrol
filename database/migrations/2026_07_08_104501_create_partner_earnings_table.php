<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            // First day of the month this earning covers: e.g. 2026-06-01
            $table->date('month');
            $table->unsignedBigInteger('total_amount')->default(0)->comment('Total commission in kobo/cents');
            $table->unsignedBigInteger('revenue_amount')->default(0)->comment('Total gross revenue in kobo/cents');
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();

            $table->unique(['partner_id', 'month']);
            $table->index('month');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_earnings');
    }
};
