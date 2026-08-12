<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Events\Admin\ResidentCreated;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreateResidentAction
{
    public function __construct() {}

    /**
     * @param  array{name: string, email: string, phone?: string|null, unit_number?: string|null, address?: string|null}  $data
     */
    public function execute(array $data, Estate $estate): User
    {
        return DB::transaction(function () use ($data, $estate) {
            // 1. Get or create user (invitation pending if new user)
            $user = User::firstOrCreate(
                ['email' => strtolower(trim($data['email']))],
                [
                    'name' => $data['name'],
                    'password' => null,
                ]
            );

            // 2. Attach user to estate with pending status (invitation pending acceptance) if not exist
            $membership = DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->where('user_id', $user->id)
                ->first();

            if (! $membership) {
                $estate->users()->attach($user->id, [
                    'status' => 'pending',
                    'property_owner_id' => $data['property_owner_id'] ?? null,
                    'relationship_type' => 'resident',
                ]);
            } else {
                DB::table('estate_users_membership')
                    ->where('id', $membership->id)
                    ->update([
                        'property_owner_id' => $data['property_owner_id'] ?? $membership->property_owner_id,
                        'relationship_type' => 'resident',
                    ]);
            }

            // 3. Assign global resident role scoped to this estate
            $role = Role::where('name', 'resident')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);
            $user->assignRole($role);

            // 4. Create or update user profile with additional data
            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'unit_number' => $data['unit_number'] ?? null,
                    'address' => $data['address'] ?? null,
                    'property_id' => $data['property_id'] ?? null,
                ]
            );

            // 5. Create an invitation record for the unified passwordless flow
            $createInvitationAction = app(\App\Actions\Invitation\CreateInvitationAction::class);
            $invitation = $createInvitationAction->execute(
                email: $data['email'],
                estate: $estate,
                relationshipType: 'resident',
                role: null, // Residents don't get an explicit Spatie role assignment in Invitations, they are handled generically
                zoneId: null,
                scopeType: \App\Enums\AssignmentScope::Estate->value,
                createdBy: Auth::user()
            );

            // 6. Dispatch event for side effects (invitation email)
            event(new ResidentCreated($invitation ?: $user, $estate, false));

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('invited resident '.$user->email);

            return $user;
        });
    }
}
