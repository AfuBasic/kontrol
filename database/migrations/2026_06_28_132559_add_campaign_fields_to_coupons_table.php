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
        Schema::table('coupons', function (Blueprint $table) {
            $table->string('campaign_name')->nullable();
            $table->text('description')->nullable();
            $table->text('internal_notes')->nullable();
            $table->string('marketing_tag')->nullable();
            $table->foreignId('creator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('active'); // active, paused
            $table->json('eligible_plans')->nullable();
            $table->unsignedInteger('min_purchase')->nullable(); // in kobo
            $table->dateTime('starts_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('creator_id');
            $table->dropColumn([
                'campaign_name',
                'description',
                'internal_notes',
                'marketing_tag',
                'status',
                'eligible_plans',
                'min_purchase',
                'starts_at',
            ]);
        });
    }
};
