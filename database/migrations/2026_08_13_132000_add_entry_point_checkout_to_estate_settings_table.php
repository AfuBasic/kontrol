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
            $table->boolean('entry_point_checkout_enforced')->default(false)->after('visitor_checkout_enabled');
            $table->json('entry_points')->nullable()->after('entry_point_checkout_enforced');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->dropColumn(['entry_point_checkout_enforced', 'entry_points']);
        });
    }
};
