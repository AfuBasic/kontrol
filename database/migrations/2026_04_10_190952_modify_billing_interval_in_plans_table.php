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
        // First, convert enum to varchar to allow any value
        Schema::table('plans', function (Blueprint $table) {
            $table->string('billing_interval')->change();
        });

        // Update existing values to new format
        DB::table('plans')->where('billing_interval', 'monthly')->update(['billing_interval' => 'quarterly']);
        DB::table('plans')->where('billing_interval', 'annual')->update(['billing_interval' => 'annually']);

        // Convert back to enum with new values
        Schema::table('plans', function (Blueprint $table) {
            $table->enum('billing_interval', ['quarterly', 'semi-annually', 'annually'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert enum to varchar to allow any value
        Schema::table('plans', function (Blueprint $table) {
            $table->string('billing_interval')->change();
        });

        // Revert the values back
        DB::table('plans')->where('billing_interval', 'quarterly')->update(['billing_interval' => 'monthly']);
        DB::table('plans')->where('billing_interval', 'semi-annually')->update(['billing_interval' => 'semi-annual']);
        DB::table('plans')->where('billing_interval', 'annually')->update(['billing_interval' => 'annual']);

        // Convert back to varchar (don't use enum to avoid data type issues)
        // This is safer than trying to enforce an enum during rollback
    }
};
