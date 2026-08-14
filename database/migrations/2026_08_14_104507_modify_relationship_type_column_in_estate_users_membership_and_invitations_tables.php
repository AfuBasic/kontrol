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
            $table->string('relationship_type', 50)->nullable()->change();
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->string('relationship_type', 50)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->enum('relationship_type', ['resident', 'property_owner', 'security', 'staff'])->nullable()->change();
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->enum('relationship_type', ['resident', 'property_owner', 'security', 'staff'])->nullable()->change();
        });
    }
};
