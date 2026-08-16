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

class DeleteResidentAction
{
    public function execute(User $resident, Estate $estate): void
    {
        if ($resident->email === $estate->email) {
            abort(403, 'The estate creator cannot be deleted.');
        }

        DB::transaction(function () use ($resident, $estate) {
            $residentRole = Role::where('name', 'resident')->whereNull('estate_id')->first();

            // 1. Remove administrative assignment for resident in this estate
            if ($residentRole) {
                AdministrativeAssignment::where('user_id', $resident->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $residentRole->id)
                    ->delete();
            }

            // 2. Remove Spatie resident role for this estate team context
            app(ContextManager::class)->setSystemContext($estate->id);
            if ($resident->hasRole('resident')) {
                $resident->removeRole('resident');
            }

            // 3. Remove/cancel any pending invitations for resident in this estate
            Invitation::withoutGlobalScopes()
                ->where('estate_id', $estate->id)
                ->where('email', $resident->email)
                ->where('relationship_type', 'resident')
                ->delete();

            // 4. Cancel/clean up resident subscriptions for this estate
            $resident->residentSubscription()->where('estate_id', $estate->id)->delete();

            // 5. Check if user still has other active roles/assignments in this estate (e.g. security, property_owner, admin)
            $remainingAssignments = AdministrativeAssignment::where('user_id', $resident->id)
                ->where('estate_id', $estate->id)
                ->where('is_active', true)
                ->get();

            if ($remainingAssignments->isNotEmpty()) {
                // User still holds other roles in this estate
                $nextRole = Role::find($remainingAssignments->first()->role_id);
                DB::table('estate_users_membership')
                    ->where('estate_id', $estate->id)
                    ->where('user_id', $resident->id)
                    ->update([
                        'relationship_type' => $nextRole?->name ?? 'security',
                    ]);
            } else {
                // That was their only role in this estate -> detach and delete user
                $estate->users()->detach($resident->id);
                $resident->delete();
            }

            activity()
                ->performedOn($resident)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('removed resident role from '.$resident->name);
        });
    }
}
