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
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->unsignedBigInteger('zone_id')->nullable()->after('status');
            $table->enum('relationship_type', ['resident', 'property_owner', 'security', 'staff'])->nullable()->after('zone_id');
            $table->unsignedBigInteger('property_owner_id')->nullable()->after('relationship_type');

            $table->foreign('property_owner_id')->references('id')->on('users')->nullOnDelete();
        });

        // Backfill property_owner_id from user_profiles to estate_users_membership
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('
                UPDATE estate_users_membership 
                SET property_owner_id = (
                    SELECT property_owner_id FROM user_profiles 
                    WHERE user_profiles.user_id = estate_users_membership.user_id 
                    AND property_owner_id IS NOT NULL
                )
                WHERE EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = estate_users_membership.user_id 
                    AND property_owner_id IS NOT NULL
                )
            ');
        } else {
            DB::statement('
                UPDATE estate_users_membership eum
                JOIN user_profiles up ON eum.user_id = up.user_id
                SET eum.property_owner_id = up.property_owner_id
                WHERE up.property_owner_id IS NOT NULL
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->dropForeign(['property_owner_id']);
            $table->dropColumn(['zone_id', 'relationship_type', 'property_owner_id']);
        });
    }
};
