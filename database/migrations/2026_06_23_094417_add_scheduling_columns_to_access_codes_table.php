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
        Schema::table('access_codes', function (Blueprint $table) {
            $table->timestamp('starts_at')->nullable()->after('status');
            $table->string('schedule_type')->default('one_time')->after('starts_at');
            $table->json('schedule_data')->nullable()->after('schedule_type');
            $table->integer('guest_limit')->nullable()->after('schedule_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_codes', function (Blueprint $table) {
            $table->dropColumn(['starts_at', 'schedule_type', 'schedule_data', 'guest_limit']);
        });
    }
};
