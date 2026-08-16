<?php

namespace App\Actions\Admin;

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AssignUsersToZoneAction
{
    /**
     * Move estate members to a zone, or back to the entire estate.
     *
     * @param  array<int, int>  $userIds
     */
    public function execute(array $userIds, Estate $estate, ?int $zoneId): int
    {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($userIds === []) {
            return 0;
        }

        $zone = $this->resolveZone($estate, $zoneId);
        $scopeType = $zone ? AssignmentScope::Zone : AssignmentScope::Estate;

        return DB::transaction(function () use ($userIds, $estate, $zone, $scopeType) {
            $updated = DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->whereIn('user_id', $userIds)
                ->update([
                    'zone_id' => $zone?->id,
                    'updated_at' => now(),
                ]);

            $roleIds = Role::query()
                ->whereIn('name', ['resident', 'household_member', 'property_owner'])
                ->whereNull('estate_id')
                ->pluck('id');

            if ($roleIds->isNotEmpty()) {
                AdministrativeAssignment::query()
                    ->where('estate_id', $estate->id)
                    ->whereIn('user_id', $userIds)
                    ->whereIn('role_id', $roleIds)
                    ->update([
                        'zone_id' => $zone?->id,
                        'scope_type' => $scopeType,
                    ]);
            }

            $emails = User::query()
                ->whereIn('id', $userIds)
                ->pluck('email')
                ->map(fn (string $email) => strtolower(trim($email)))
                ->filter()
                ->values();

            if ($emails->isNotEmpty()) {
                Invitation::withoutGlobalScopes()
                    ->where('estate_id', $estate->id)
                    ->whereIn('email', $emails)
                    ->where('status', 'pending')
                    ->update([
                        'zone_id' => $zone?->id,
                        'scope_type' => $scopeType,
                    ]);
            }

            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'zone_id' => $zone?->id,
                    'user_ids' => $userIds,
                ])
                ->log($zone
                    ? 'moved members to zone '.$zone->name
                    : 'moved members to entire estate');

            return $updated;
        });
    }

    private function resolveZone(Estate $estate, ?int $zoneId): ?Zone
    {
        if ($zoneId === null) {
            return null;
        }

        $zone = Zone::query()
            ->where('id', $zoneId)
            ->where('estate_id', $estate->id)
            ->first();

        if (! $zone) {
            throw ValidationException::withMessages([
                'zone_id' => 'The selected zone does not belong to this estate.',
            ]);
        }

        return $zone;
    }
}
