<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class MarkResidentAsPropertyOwnerAction
{
    public function __construct() {}

    public function execute(User $resident, Estate $estate): void
    {
        DB::transaction(function () use ($resident, $estate) {
            $poRole = Role::where('name', 'property_owner')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            $residentRole = Role::where('name', 'resident')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->first();

            $householdRole = Role::where('name', 'household_member')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->first();

            app(ContextManager::class)->setSystemContext($estate->id);

            // 1. Assign property_owner role
            if (! $resident->hasRole('property_owner')) {
                $resident->assignRole($poRole);
            }

            // 2. Ensure property_owner administrative assignment exists & is active
            AdministrativeAssignment::updateOrCreate(
                [
                    'user_id' => $resident->id,
                    'estate_id' => $estate->id,
                    'role_id' => $poRole->id,
                ],
                [
                    'scope_type' => AssignmentScope::Estate,
                    'is_primary' => false,
                    'is_active' => true,
                ]
            );

            // 3. Remove resident and household_member roles and assignments
            if ($residentRole) {
                if ($resident->hasRole('resident')) {
                    $resident->removeRole($residentRole);
                }
                AdministrativeAssignment::where('user_id', $resident->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $residentRole->id)
                    ->delete();
            }

            if ($householdRole) {
                if ($resident->hasRole('household_member')) {
                    $resident->removeRole($householdRole);
                }
                AdministrativeAssignment::where('user_id', $resident->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $householdRole->id)
                    ->delete();
            }

            // 4. Null out their property_owner_id since they are now a property owner themselves
            DB::table('estate_users_membership')
                ->where('user_id', $resident->id)
                ->where('estate_id', $estate->id)
                ->update(['property_owner_id' => null]);

            // Log the activity
            activity()
                ->performedOn($resident)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('swapped resident role to property owner for '.$resident->name);
        });
    }
}
