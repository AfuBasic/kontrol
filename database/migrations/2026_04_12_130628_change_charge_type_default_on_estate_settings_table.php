<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->string('charge_type')->default('residents')->change();
        });

        // Update all existing estates to use 'residents' billing by default
        DB::table('estate_settings')->update(['charge_type' => 'residents']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->string('charge_type')->default('estate')->change();
        });
    }
};
