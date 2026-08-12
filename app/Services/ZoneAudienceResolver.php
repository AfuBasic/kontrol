<?php

namespace App\Services;

use App\Models\Estate;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Support\Collection;

class ZoneAudienceResolver
{
    /**
     * Active zone options for an estate.
     *
     * @return Collection<int, Zone>
     */
    public function zonesForEstate(int $estateId): Collection
    {
        return Zone::query()
            ->where('estate_id', $estateId)
            ->orderBy('name')
            ->get(['id', 'name', 'estate_id']);
    }

    /**
     * Zone IDs a user belongs to via membership or property.
     *
     * @return array<int>
     */
    public function zoneIdsForUser(User $user, int $estateId): array
    {
        $ids = [];

        $membershipZoneId = $user->estateMembershipFor($estateId)?->zone_id;
        if ($membershipZoneId) {
            $ids[] = (int) $membershipZoneId;
        }

        $propertyId = $user->profile?->property_id;
        if ($propertyId) {
            $propertyZoneId = Property::withoutZoneIsolation()
                ->where('id', $propertyId)
                ->where('estate_id', $estateId)
                ->value('zone_id');

            if ($propertyZoneId) {
                $ids[] = (int) $propertyZoneId;
            }
        }

        return array_values(array_unique($ids));
    }

    public function userBelongsToZone(User $user, Estate|int $estate, int $zoneId): bool
    {
        $estateId = $estate instanceof Estate ? $estate->id : $estate;

        return in_array($zoneId, $this->zoneIdsForUser($user, $estateId), true);
    }

    /**
     * Residents associated with the given zones (via property.zone_id or membership.zone_id).
     *
     * @param  array<int>  $zoneIds
     * @return array<int>
     */
    public function userIdsInZones(int $estateId, array $zoneIds, bool $activeOnly = true): array
    {
        $zoneIds = array_values(array_unique(array_filter($zoneIds, fn ($id) => (int) $id > 0)));

        if ($zoneIds === []) {
            return [];
        }

        $propertyIds = Property::withoutZoneIsolation()
            ->where('estate_id', $estateId)
            ->whereIn('zone_id', $zoneIds)
            ->pluck('id');

        $query = User::query()
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estateId))
            ->where(function ($q) use ($estateId, $zoneIds, $propertyIds) {
                $q->whereHas('profile', fn ($pq) => $pq->whereIn('property_id', $propertyIds))
                    ->orWhereHas('estates', fn ($eq) => $eq
                        ->where('estates.id', $estateId)
                        ->whereIn('estate_users_membership.zone_id', $zoneIds));
            });

        if ($activeOnly) {
            $query->active()->acceptedInvitation();
        }

        return $query->pluck('users.id')->unique()->values()->all();
    }
}
