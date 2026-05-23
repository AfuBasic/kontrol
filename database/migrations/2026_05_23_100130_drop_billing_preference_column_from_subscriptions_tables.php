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
            $table->dropColumn('billing_preference');
        });

        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->dropColumn('billing_preference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->enum('billing_preference', ['auto', 'manual'])->default('auto')->after('status');
        });

        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->enum('billing_preference', ['auto', 'manual'])->default('auto')->after('status');
        });
    }
};
