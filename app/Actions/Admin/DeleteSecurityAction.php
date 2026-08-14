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

class DeleteSecurityAction
{
    public function execute(User $security, Estate $estate): void
    {
        DB::transaction(function () use ($security, $estate) {
            $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();

            // 1. Remove administrative assignment for security in this estate
            if ($securityRole) {
                AdministrativeAssignment::where('user_id', $security->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $securityRole->id)
                    ->delete();
            }

            // 2. Remove Spatie security role for this estate team context
            app(ContextManager::class)->setSystemContext($estate->id);
            if ($security->hasRole('security')) {
                $security->removeRole('security');
            }

            // 3. Clean up pending invitations for security in this estate
            Invitation::withoutGlobalScopes()
                ->where('estate_id', $estate->id)
                ->where('email', $security->email)
                ->where('relationship_type', 'security')
                ->delete();

            // 4. Check if user still has other active roles/assignments in this estate
            $remainingAssignments = AdministrativeAssignment::where('user_id', $security->id)
                ->where('estate_id', $estate->id)
                ->where('is_active', true)
                ->get();

            if ($remainingAssignments->isNotEmpty()) {
                // User still has another role (e.g. resident, property_owner, admin)
                // Keep user and membership, update relationship_type to their remaining role
                $nextRole = Role::find($remainingAssignments->first()->role_id);
                DB::table('estate_users_membership')
                    ->where('estate_id', $estate->id)
                    ->where('user_id', $security->id)
                    ->update([
                        'relationship_type' => $nextRole?->name ?? 'resident',
                    ]);
            } else {
                // That was their only role in this estate -> detach and delete user
                $estate->users()->detach($security->id);
                $security->delete();
            }

            activity()
                ->performedOn($security)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('removed security role from '.$security->name);
        });
    }
}
