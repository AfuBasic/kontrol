<?php

namespace App\Services\Security;

use App\Models\AccessCode;
use App\Models\EstateMembership;
use App\Models\EstateSettings;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Support\Collection;

/**
 * Zone-locked passes: when an estate turns the setting on, a pass can only be admitted at a gate that serves
 * the zone of the resident who issued it.
 *
 * A guard has no zone of their own. They take the zone of the gate they are signed on to, so a guard who works
 * Gate A today and Gate B tomorrow is in a different zone tomorrow without anyone updating anything.
 *
 * Deliberately lenient where a zone is unknown, so a gate is never locked out by incomplete setup:
 * a guard who is not signed on to a gate, or a gate set to "all zones", can admit any pass, and a pass from a
 * resident with no zone can be admitted anywhere. The resident's zone is read at scan time (not copied onto the
 * pass), so moving a resident to another zone also moves their existing passes.
 *
 * This guards against a pass being used at the wrong gate. It does not stop a determined guard, who can sign on
 * to any free gate.
 */
class ZonePassGuard
{
    public const STATUS = 'wrong_zone';

    public const MESSAGE = 'This pass belongs to a different zone. Send the visitor to the correct gate.';

    public const ALL_ZONES = 'all';

    public function __construct(private CheckpointClaimService $checkpoints) {}

    public function isEnabled(int $estateId): bool
    {
        return (bool) EstateSettings::forEstate($estateId)->zone_locked_passes;
    }

    /**
     * The gate this guard is signed on to, if any.
     */
    public function gateOf(User $guard, int $estateId): ?string
    {
        return $this->checkpoints->getCurrentCheckpoint($estateId, $guard);
    }

    /**
     * The one zone this guard may admit passes for right now, or null when unrestricted.
     */
    public function guardZone(User $guard, int $estateId): ?int
    {
        $gate = $this->gateOf($guard, $estateId);

        if ($gate === null) {
            return null;
        }

        $zone = (EstateSettings::forEstate($estateId)->entry_point_zones ?? [])[$gate] ?? null;

        if ($zone === null || $zone === self::ALL_ZONES) {
            return null;
        }

        // A zone that has since been deleted no longer restricts the gate.
        $exists = Zone::query()->where('estate_id', $estateId)->whereKey((int) $zone)->exists();

        return $exists ? (int) $zone : null;
    }

    public function hostZone(AccessCode $accessCode, int $estateId): ?int
    {
        if ($accessCode->user_id === null) {
            return null;
        }

        $zoneId = EstateMembership::query()
            ->where('estate_id', $estateId)
            ->where('user_id', $accessCode->user_id)
            ->value('zone_id');

        return $zoneId !== null ? (int) $zoneId : null;
    }

    /**
     * Whether this guard may admit (or check out) this pass at the gate they are on.
     */
    public function allows(AccessCode $accessCode, User $guard, int $estateId): bool
    {
        if (! $this->isEnabled($estateId)) {
            return true;
        }

        $guardZone = $this->guardZone($guard, $estateId);
        if ($guardZone === null) {
            return true;
        }

        $hostZone = $this->hostZone($accessCode, $estateId);

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

        $guardZone = $this->guardZone($guard, $estateId);
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
                'gate' => $this->gateOf($guard, $estateId),
                'guard_zone_id' => $this->guardZone($guard, $estateId),
                'pass_zone_id' => $this->hostZone($accessCode, $estateId),
            ])
            ->log('Security guard scanned a pass from another zone');
    }
}
