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
        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->unsignedTinyInteger('billing_anchor_day')->nullable()->after('billing_interval');
            $table->date('next_billing_date')->nullable()->after('billing_anchor_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['billing_anchor_day', 'next_billing_date']);
        });
    }
};
