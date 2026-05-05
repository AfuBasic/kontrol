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
        // 1. Temporarily change to string to allow any value
        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->string('billing_interval')->change();
        });

        // 2. Map old values to new ones if any exist
        DB::table('estate_subscriptions')->where('billing_interval', 'monthly')->update(['billing_interval' => 'quarterly']);
        DB::table('estate_subscriptions')->where('billing_interval', 'annual')->update(['billing_interval' => 'annually']);

        // 3. Change back to enum with synchronized values
        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->enum('billing_interval', ['quarterly', 'semi-annually', 'annually'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->string('billing_interval')->change();
        });

        DB::table('estate_subscriptions')->where('billing_interval', 'quarterly')->update(['billing_interval' => 'monthly']);
        DB::table('estate_subscriptions')->where('billing_interval', 'annually')->update(['billing_interval' => 'annual']);

        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->enum('billing_interval', ['monthly', 'annual'])->change();
        });
    }
};
