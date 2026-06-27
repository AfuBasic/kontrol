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
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->boolean('visitor_checkout_enabled')->default(false)->after('access_code_require_confirmation');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->timestamp('checked_out_at')->nullable()->after('vehicle_plate_number');
            $table->foreignId('checked_out_by')->nullable()->after('checked_out_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->dropColumn('visitor_checkout_enabled');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropForeign(['checked_out_by']);
            $table->dropColumn(['checked_out_at', 'checked_out_by']);
        });
    }
};
