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
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->string('hours_enforcement')->default('inherit')->after('operating_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->dropColumn('hours_enforcement');
        });
    }
};
