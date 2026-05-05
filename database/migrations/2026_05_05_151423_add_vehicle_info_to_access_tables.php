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
            $table->boolean('has_vehicle')->default(false)->after('purpose');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->string('vehicle_make')->nullable()->after('meta');
            $table->string('vehicle_model')->nullable()->after('vehicle_make');
            $table->string('vehicle_plate_number')->nullable()->after('vehicle_model');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_codes', function (Blueprint $table) {
            $table->dropColumn('has_vehicle');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropColumn(['vehicle_make', 'vehicle_model', 'vehicle_plate_number']);
        });
    }
};
