<?php

use App\Models\Estate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estate_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Estate::class)->unique()->constrained()->cascadeOnDelete();

            // Access Code System Toggle (Global Kill Switch)
            $table->boolean('access_codes_enabled')->default(true);

            // Access Code Lifespan Configuration
            $table->unsignedInteger('access_code_min_lifespan_minutes')->default(15);
            $table->unsignedInteger('access_code_max_lifespan_minutes')->default(1440); // 24 hours

            // Access Code Behavior
            $table->boolean('access_code_single_use')->default(true);
            $table->boolean('access_code_auto_expire_unused')->default(true);
            $table->unsignedInteger('access_code_grace_period_minutes')->default(5);

            // Access Code Limits & Controls
            $table->unsignedInteger('access_code_daily_limit_per_resident')->nullable(); // NULL = unlimited
            $table->boolean('access_code_require_confirmation')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_settings');
    }
};
