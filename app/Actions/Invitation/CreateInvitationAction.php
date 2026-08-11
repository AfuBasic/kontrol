<?php

namespace App\Actions\Invitation;

use App\Models\Estate;
use App\Models\Invitation;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class CreateInvitationAction
{
    /**
     * Create a new invitation.
     */
    public function execute(
        string $email,
        Estate $estate,
        string $relationshipType,
        ?Role $role = null,
        ?int $zoneId = null,
        string $scopeType = 'estate',
        ?User $createdBy = null
    ): ?Invitation {
        // 1. Normalize Email
        $email = strtolower(trim($email));

        // 2. Validate Membership: Does the user already belong to this estate?
        // We look for any existing user with this email who is already a member of the estate.
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $isMember = DB::table('estate_users_membership')
                ->where('user_id', $existingUser->id)
                ->where('estate_id', $estate->id)
                ->whereIn('status', ['accepted', 'active'])
                ->exists();

            if ($isMember) {
                // Return null to signify that the invitation should be skipped because they are already a member.
                return null;
            }
        }

        // 3. Validation: Zone belongs to Estate
        if ($zoneId) {
            $zoneExists = Zone::where('id', $zoneId)->where('estate_id', $estate->id)->exists();
            if (! $zoneExists) {
                throw new \InvalidArgumentException("Zone {$zoneId} does not belong to Estate {$estate->id}.");
            }
        }

        // 4. Validation: Role belongs to Estate (prevent global roles)
        if ($role) {
            if ($role->estate_id !== $estate->id) {
                throw new \InvalidArgumentException("Role {$role->id} does not belong to Estate {$estate->id}.");
            }
            if ($role->guard_name !== 'web') {
                throw new \InvalidArgumentException('Only web guard roles are permitted.');
            }
        }

        // 5. Idempotent Invitation Creation/Refresh (respecting UNIQUE(estate_id, email))
        $invitation = Invitation::withoutGlobalScope(ZoneScope::class)->updateOrCreate(
            ['estate_id' => $estate->id, 'email' => $email],
            [
                'relationship_type' => $relationshipType,
                'role_id' => $role?->id,
                'scope_type' => $scopeType,
                'zone_id' => $zoneId,
                'token' => Str::random(64),
                'status' => 'pending',
                'expires_at' => Carbon::now()->addDays(7),
                'accepted_at' => null,
                'cancelled_at' => null,
                'created_by' => $createdBy?->id,
            ]
        );

        return $invitation;
    }
}
