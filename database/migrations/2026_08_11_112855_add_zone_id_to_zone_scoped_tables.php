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
        Schema::table('incidents', function (Blueprint $table) {
            $table->unsignedBigInteger('zone_id')->nullable()->after('estate_id');
            $table->foreign('zone_id')->references('id')->on('zones')->nullOnDelete();
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('zone_id')->nullable()->after('estate_id');
            $table->foreign('zone_id')->references('id')->on('zones')->nullOnDelete();
        });

        Schema::table('sos_events', function (Blueprint $table) {
            $table->unsignedBigInteger('zone_id')->nullable()->after('estate_id');
            $table->foreign('zone_id')->references('id')->on('zones')->nullOnDelete();
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->unsignedBigInteger('zone_id')->nullable()->after('estate_id');
            $table->foreign('zone_id')->references('id')->on('zones')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropForeign(['zone_id']);
            $table->dropColumn('zone_id');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropForeign(['zone_id']);
            $table->dropColumn('zone_id');
        });

        Schema::table('sos_events', function (Blueprint $table) {
            $table->dropForeign(['zone_id']);
            $table->dropColumn('zone_id');
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->dropForeign(['zone_id']);
            $table->dropColumn('zone_id');
        });
    }
};
