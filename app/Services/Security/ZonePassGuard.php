<?php

namespace App\Services\Security;

use App\Models\AccessCode;
use App\Models\EstateMembership;
use App\Models\EstateSettings;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Zone-locked passes: when an estate turns the setting on, a pass can only be admitted by a guard
 * who is assigned to the zone of the resident who issued it.
 *
 * Deliberately lenient where a zone is unknown, so a gate is never locked out by incomplete setup:
 * a guard with no zone is estate-wide, and a pass from a resident with no zone can be admitted anywhere.
 * The resident's zone is read at scan time (not copied onto the pass), so moving a resident to another
 * zone also moves their existing passes.
 */
class ZonePassGuard
{
    public const STATUS = 'wrong_zone';

    public const MESSAGE = 'This pass belongs to a different zone. Send the visitor to the correct gate.';

    public function isEnabled(int $estateId): bool
    {
        return (bool) EstateSettings::forEstate($estateId)->zone_locked_passes;
    }

    public function zoneOf(User $user, int $estateId): ?int
    {
        $zoneId = EstateMembership::query()
            ->where('estate_id', $estateId)
            ->where('user_id', $user->id)
            ->value('zone_id');

        return $zoneId !== null ? (int) $zoneId : null;
    }

    /**
     * Whether this guard may admit (or check out) this pass.
     */
    public function allows(AccessCode $accessCode, User $guard, int $estateId): bool
    {
        if (! $this->isEnabled($estateId)) {
            return true;
        }

        $guardZone = $this->zoneOf($guard, $estateId);
        if ($guardZone === null) {
            return true;
        }

        $hostZone = $accessCode->user_id !== null
            ? $this->zoneOf($accessCode->user ?? User::findOrFail($accessCode->user_id), $estateId)
            : null;

        return $hostZone === null || $hostZone === $guardZone;
    }

    /**
     * Keep only the passes this guard may admit (used for the offline cache).
     *
     * @param  Collection<int, AccessCode>  $codes
     * @return Collection<int, AccessCode>
     */
    public function filterFor(Collection $codes, User $guard, int $estateId): Collection
    {
        if (! $this->isEnabled($estateId)) {
            return $codes;
        }

        $guardZone = $this->zoneOf($guard, $estateId);
        if ($guardZone === null) {
            return $codes;
        }

        $zonesByHost = EstateMembership::query()
            ->where('estate_id', $estateId)
            ->whereIn('user_id', $codes->pluck('user_id')->filter()->unique())
            ->pluck('zone_id', 'user_id');

        return $codes
            ->filter(fn (AccessCode $code) => ($zonesByHost[$code->user_id] ?? null) === null || (int) $zonesByHost[$code->user_id] === $guardZone)
            ->values();
    }

    /**
     * Leave a trail for the estate admin when a guard scans a pass that belongs to another zone.
     */
    public function recordRefusal(AccessCode $accessCode, User $guard, int $estateId): void
    {
        activity()
            ->causedBy($guard)
            ->performedOn($accessCode)
            ->withProperties([
                'estate_id' => $estateId,
                'guard_zone_id' => $this->zoneOf($guard, $estateId),
                'pass_zone_id' => $accessCode->user_id ? $this->zoneOf($accessCode->user ?? User::findOrFail($accessCode->user_id), $estateId) : null,
            ])
            ->log('Security guard scanned a pass from another zone');
    }
}
