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
            $table->dropColumn('access_code_auto_expire_unused');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->boolean('access_code_auto_expire_unused')->default(true);
        });
    }
};
