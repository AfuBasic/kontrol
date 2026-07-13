<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commission_plans', function (Blueprint $table) {
            // null = always eligible (no fixed partner commission tenure)
            $table->unsignedInteger('duration_months')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('commission_plans', function (Blueprint $table) {
            $table->unsignedInteger('duration_months')->nullable(false)->default(12)->change();
        });
    }
};
