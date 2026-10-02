<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The per-organization "Quick Entry" switch was retired: an organization takes walk-ins according
 * to its access policy alone, and the estate keeps its own switch in estate_settings. Organizations
 * that had the switch off were already moved to the "managed" policy by
 * 2026_10_01_223132_convert_disabled_quick_entry_orgs_to_managed, so nothing is lost here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->dropColumn('quick_entry_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->boolean('quick_entry_enabled')->default(true)->after('is_active');
        });
    }
};
