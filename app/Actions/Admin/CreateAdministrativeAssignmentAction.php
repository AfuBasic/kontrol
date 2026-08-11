<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class CreateAdministrativeAssignmentAction
{
    /**
     * Create an authoritative administrative assignment, enforcing all domain invariants.
     *
     * Dual-writes Spatie model_has_roles so AuthorizationResolver can validate the role
     * while AdministrativeAssignment remains the context/scope source of truth.
     *
     * @throws ValidationException
     */
    public function execute(
        User $user,
        Estate $estate,
        Role $role,
        AssignmentScope $scopeType,
        ?Zone $zone = null,
        bool $isPrimary = false,
        bool $isActive = true
    ): AdministrativeAssignment {
        $this->assertRoleBelongsToEstate($role, $estate);
        $this->assertScopeIntegrity($scopeType, $zone, $estate);
        $this->assertAcceptedMembership($user, $estate);
        $this->assertPrimaryInvariant($user, $estate, $isPrimary, $isActive);
        $this->assertNotDuplicate($user, $estate, $role, $zone);

        return DB::transaction(function () use ($user, $estate, $role, $scopeType, $zone, $isPrimary, $isActive) {
            $assignment = AdministrativeAssignment::create([
                'user_id' => $user->id,
                'estate_id' => $estate->id,
                'role_id' => $role->id,
                'scope_type' => $scopeType,
                'zone_id' => $zone?->id,
                'is_primary' => $isPrimary,
                'is_active' => $isActive,
            ]);

            // Keep Spatie team-scoped roles in sync for permission resolution.
            app(ContextManager::class)->setSystemContext($estate->id, $user);

            if (! $user->hasRole($role)) {
                $user->assignRole($role);
            }

            return $assignment;
        });
    }

    /**
     * @throws ValidationException
     */
    private function assertRoleBelongsToEstate(Role $role, Estate $estate): void
    {
        if ($role->estate_id === null) {
            throw ValidationException::withMessages([
                'role' => 'Global roles cannot be used for administrative assignments.',
            ]);
        }

        if ((int) $role->estate_id !== (int) $estate->id) {
            throw ValidationException::withMessages([
                'role' => 'Role does not belong to the given estate.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertScopeIntegrity(AssignmentScope $scopeType, ?Zone $zone, Estate $estate): void
    {
        if ($scopeType === AssignmentScope::Estate && $zone !== null) {
            throw ValidationException::withMessages([
                'zone' => 'Zone must be null for estate scope.',
            ]);
        }

        if ($scopeType === AssignmentScope::Zone) {
            if ($zone === null) {
                throw ValidationException::withMessages([
                    'zone' => 'Zone is required for zone scope.',
                ]);
            }

            if ((int) $zone->estate_id !== (int) $estate->id) {
                throw ValidationException::withMessages([
                    'zone' => 'Zone does not belong to the given estate.',
                ]);
            }
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertAcceptedMembership(User $user, Estate $estate): void
    {
        $hasMembership = $user->estates()
            ->where('estates.id', $estate->id)
            ->wherePivot('status', 'accepted')
            ->exists();

        if (! $hasMembership) {
            throw ValidationException::withMessages([
                'user' => 'User is not a verified member of this estate.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertPrimaryInvariant(User $user, Estate $estate, bool $isPrimary, bool $isActive): void
    {
        if (! $isPrimary || ! $isActive) {
            return;
        }

        $hasPrimary = AdministrativeAssignment::query()
            ->where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->where('is_primary', true)
            ->where('is_active', true)
            ->exists();

        if ($hasPrimary) {
            throw ValidationException::withMessages([
                'is_primary' => 'User already has an active primary assignment in this estate.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertNotDuplicate(User $user, Estate $estate, Role $role, ?Zone $zone): void
    {
        $zoneIdCoalesced = $zone ? $zone->id : 0;

        $isDuplicate = AdministrativeAssignment::query()
            ->where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->where('role_id', $role->id)
            ->where('zone_id_coalesced', $zoneIdCoalesced)
            ->exists();

        if ($isDuplicate) {
            throw ValidationException::withMessages([
                'assignment' => 'This administrative assignment already exists.',
            ]);
        }
    }
}
