<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Clear the flawed backfill from all estate memberships where the property_owner_id is not null
        // (because we don't know which ones were correctly assigned and which were blindly copied)
        DB::table('estate_users_membership')->update(['property_owner_id' => null]);

        // 2. Fetch all user profiles that have a property_owner_id
        $profiles = DB::table('user_profiles')
            ->whereNotNull('property_owner_id')
            ->get();

        foreach ($profiles as $profile) {
            $residentId = $profile->user_id;
            $propertyOwnerId = $profile->property_owner_id;

            // Find the estates that both the resident and the property owner belong to
            // A property owner belongs to an estate if they have an active/accepted membership
            // OR if they have a role for that estate.
            // In Kontrol, a property owner typically has a role of 'property_owner' for the estate,
            // or an estate membership. Let's find common estates via `estate_users_membership`.
            $sharedEstates = DB::table('estate_users_membership as resident_eum')
                ->join('estate_users_membership as owner_eum', 'resident_eum.estate_id', '=', 'owner_eum.estate_id')
                ->where('resident_eum.user_id', $residentId)
                ->where('owner_eum.user_id', $propertyOwnerId)
                ->pluck('resident_eum.estate_id')
                ->toArray();

            if (empty($sharedEstates)) {
                // If they don't share any estate in memberships, maybe the property owner only has a role?
                $sharedEstates = DB::table('estate_users_membership as resident_eum')
                    ->join('model_has_roles', function ($join) use ($propertyOwnerId) {
                        $join->on('resident_eum.estate_id', '=', 'model_has_roles.estate_id')
                            ->where('model_has_roles.model_id', $propertyOwnerId)
                            ->where('model_has_roles.model_type', User::class);
                    })
                    ->where('resident_eum.user_id', $residentId)
                    ->pluck('resident_eum.estate_id')
                    ->toArray();
            }

            if (count($sharedEstates) === 1) {
                // Unambiguous common estate. Update the resident's membership for this estate.
                DB::table('estate_users_membership')
                    ->where('user_id', $residentId)
                    ->where('estate_id', $sharedEstates[0])
                    ->update(['property_owner_id' => $propertyOwnerId]);
            } elseif (count($sharedEstates) > 1) {
                // Ambiguous: they share multiple estates. We can't automatically know which one the
                // legacy global property_owner_id was intended for.
                Log::warning(
                    "Ambiguous property_owner backfill for user {$residentId} with owner {$propertyOwnerId}. Shared estates: ".implode(',', $sharedEstates)
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // To reverse, we can't reliably restore the exact state if someone modified it after this migration.
        // But for completeness, we clear the new data and run the old flawed backfill logic so the state
        // matches what was there before this correction.
        DB::table('estate_users_membership')->update(['property_owner_id' => null]);

        DB::statement('
            UPDATE estate_users_membership eum
            JOIN user_profiles up ON eum.user_id = up.user_id
            SET eum.property_owner_id = up.property_owner_id
            WHERE up.property_owner_id IS NOT NULL
        ');
    }
};
