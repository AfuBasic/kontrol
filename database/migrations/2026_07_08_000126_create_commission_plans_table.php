<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('commission_rate', 5, 2);
            $table->foreignId('source_referrer_id')->nullable()->constrained('referrers')->nullOnDelete();
            $table->unsignedInteger('duration_months')->default(12);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_plans');
    }
};
