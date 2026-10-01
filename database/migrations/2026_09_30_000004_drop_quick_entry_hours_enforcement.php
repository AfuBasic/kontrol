<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->dropColumn('quick_entry_hours_enforcement');
        });
    }

    public function down(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->string('quick_entry_hours_enforcement')->default('warn')->after('quick_entry_enabled');
        });
    }
};
