<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('affiliates', 'referrers');

        Schema::table('estates', function ($table) {
            $table->renameColumn('affiliate_id', 'referrer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('referrers', 'affiliates');

        Schema::table('estates', function ($table) {
            $table->renameColumn('referrer_id', 'affiliate_id');
        });
    }
};
