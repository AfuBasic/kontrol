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
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->string('created_via')->nullable()->default('system')->after('property_owner_id');
        });

        // Set existing records to 'system'
        DB::table('estate_users_membership')
            ->whereNull('created_via')
            ->update(['created_via' => 'system']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->dropColumn('created_via');
        });
    }
};
