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
        Schema::create('organization_public_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('estate_organizations')->cascadeOnDelete();
            $table->string('name'); // e.g. "Sunday Service", "Midweek Fellowship"
            $table->unsignedTinyInteger('day_of_week'); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (matching Carbon dayOfWeek)
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'is_active', 'day_of_week'], 'org_pub_windows_lookup_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_public_windows');
    }
};
