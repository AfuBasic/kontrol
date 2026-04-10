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
        Schema::create('plan_features', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plan_id')->constrained('plans')->onDelete('cascade');
            $table->foreignId('feature_id')->constrained('features')->onDelete('cascade');
            $table->boolean('is_enabled')->default(true);
            $table->string('limit')->nullable()->comment('Usage limit as string, e.g. "100", "unlimited"');
            $table->timestamps();
            $table->unique(['plan_id', 'feature_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_features');
    }
};
