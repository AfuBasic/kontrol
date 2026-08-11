<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restore property_owner_id to user_profiles.
     *
     * The previous migration dropped this column prematurely.
     * The entire PropertyOwner resident-management subsystem still relies
     * on user_profiles.property_owner_id for ownership tracking.
     * The estate_users_membership.property_owner_id is used for admin-side
     * bulk assignment; the profile column remains the authoritative source
     * for the resident/property-owner portal.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('user_profiles', 'property_owner_id')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->foreignId('property_owner_id')->nullable()->constrained('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropForeign(['property_owner_id']);
            $table->dropColumn('property_owner_id');
        });
    }
};
