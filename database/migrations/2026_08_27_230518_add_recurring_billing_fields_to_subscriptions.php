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
            $table->boolean('auto_renew_enabled')->default(false)->after('status');
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
        });

        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->boolean('auto_renew_enabled')->default(false)->after('status');
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn('auto_renew_enabled');
        });

        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn('auto_renew_enabled');
        });
    }
};
