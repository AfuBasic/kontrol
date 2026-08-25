<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class DeletePropertyOwnerAction
{
    public function execute(User $propertyOwner, Estate $estate): void
    {
        if ($propertyOwner->email === $estate->email) {
            abort(403, 'The estate creator cannot be deleted.');
        }

        DB::transaction(function () use ($propertyOwner, $estate) {
            $poRole = Role::where('name', 'property_owner')->whereNull('estate_id')->first();

            // 1. Remove administrative assignment for property_owner in this estate
            if ($poRole) {
                AdministrativeAssignment::where('user_id', $propertyOwner->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $poRole->id)
                    ->delete();
            }

            // 2. Remove Spatie property_owner role for this estate team context
            app(ContextManager::class)->setSystemContext($estate->id);
            if ($propertyOwner->hasRole('property_owner')) {
                $propertyOwner->removeRole('property_owner');
            }

            // 3. Remove/cancel any pending invitations for property_owner in this estate
            Invitation::withoutGlobalScopes()
                ->where('estate_id', $estate->id)
                ->where('email', $propertyOwner->email)
                ->where('relationship_type', 'property_owner')
                ->delete();

            // 4. Unassign property ownership link from managed residents
            DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->where('property_owner_id', $propertyOwner->id)
                ->update(['property_owner_id' => null]);

            // 5. Check if user still has other active roles/assignments in this estate (e.g. resident, security, admin)
            $remainingAssignments = AdministrativeAssignment::where('user_id', $propertyOwner->id)
                ->where('estate_id', $estate->id)
                ->where('is_active', true)
                ->get();

            if ($remainingAssignments->isNotEmpty()) {
                $nextRole = Role::find($remainingAssignments->first()->role_id);
                DB::table('estate_users_membership')
                    ->where('estate_id', $estate->id)
                    ->where('user_id', $propertyOwner->id)
                    ->update([
                        'relationship_type' => $nextRole?->name ?? 'resident',
                    ]);
            } else {
                $estate->users()->detach($propertyOwner->id);
                $propertyOwner->delete();
            }

            activity('people')
                ->performedOn($propertyOwner)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('removed property owner role from '.$propertyOwner->name);
        });
    }
}
