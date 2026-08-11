<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
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
            // Check if they are already a property owner for this estate
            if ($resident->hasRole('property_owner', $estate->id)) {
                return;
            }

            // Assign the property_owner role
            $poRole = Role::where('name', 'property_owner')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);
            $resident->assignRole($poRole);

            // Null out their property_owner_id since they are now a property owner themselves
            DB::table('estate_users_membership')
                ->where('user_id', $resident->id)
                ->where('estate_id', $estate->id)
                ->update(['property_owner_id' => null]);

            // Log the activity
            activity()
                ->performedOn($resident)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('marked resident as property owner');
        });
    }
}
