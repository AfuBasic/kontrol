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
            // Gate name => zone id, or "all" for a gate that serves every zone. Gates are still named in entry_points.
            $table->json('entry_point_zones')->nullable()->after('entry_points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->dropColumn('entry_point_zones');
        });
    }
};
