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
        Schema::table('estate_invite_links', function (Blueprint $table) {
            $table->string('role', 30)->default('resident')->after('estate_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_invite_links', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
