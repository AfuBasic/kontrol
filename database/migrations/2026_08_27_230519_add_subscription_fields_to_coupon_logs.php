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
        Schema::table('coupon_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('subscription_id')->nullable()->after('invoice_id');
            $table->string('subscription_type')->nullable()->after('subscription_id');
            $table->index(['subscription_type', 'subscription_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coupon_logs', function (Blueprint $table) {
            $table->dropIndex(['subscription_type', 'subscription_id']);
            $table->dropColumn(['subscription_id', 'subscription_type']);
        });
    }
};
