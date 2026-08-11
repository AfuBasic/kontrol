<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Zone;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UpdateAdministrativeAssignmentAction
{
    /**
     * Update an existing administrative assignment while enforcing domain invariants.
     *
     * Estate is never taken from the client — only the assignment's estate is used.
     *
     * @param  array{
     *     role_id?: int,
     *     scope_type?: string|AssignmentScope,
     *     zone_id?: int|null,
     *     is_primary?: bool,
     *     is_active?: bool
     * }  $data
     *
     * @throws ValidationException
     */
    public function execute(AdministrativeAssignment $assignment, array $data): AdministrativeAssignment
    {
        $estate = $assignment->estate;
        $role = isset($data['role_id'])
            ? Role::findOrFail($data['role_id'])
            : $assignment->role;

        $scopeType = isset($data['scope_type'])
            ? ($data['scope_type'] instanceof AssignmentScope
                ? $data['scope_type']
                : AssignmentScope::from($data['scope_type']))
            : $assignment->scope_type;

        $zone = array_key_exists('zone_id', $data)
            ? ($data['zone_id'] !== null ? Zone::findOrFail($data['zone_id']) : null)
            : $assignment->zone;

        // Estate-scoped scope always clears zone.
        if ($scopeType === AssignmentScope::Estate) {
            $zone = null;
        }

        $isPrimary = array_key_exists('is_primary', $data)
            ? (bool) $data['is_primary']
            : $assignment->is_primary;

        $isActive = array_key_exists('is_active', $data)
            ? (bool) $data['is_active']
            : $assignment->is_active;

        $this->assertRoleBelongsToEstate($role, $estate->id);
        $this->assertScopeIntegrity($scopeType, $zone, $estate->id);
        $this->assertPrimaryInvariant($assignment, $isPrimary, $isActive);
        $this->assertNotDuplicate($assignment, $role->id, $zone?->id);

        $previousRoleId = $assignment->role_id;

        return DB::transaction(function () use ($assignment, $role, $scopeType, $zone, $isPrimary, $isActive, $previousRoleId, $estate) {
            $assignment->update([
                'role_id' => $role->id,
                'scope_type' => $scopeType,
                'zone_id' => $zone?->id,
                'is_primary' => $isPrimary,
                'is_active' => $isActive,
            ]);

            $user = $assignment->user;
            app(ContextManager::class)->setSystemContext($estate->id, $user);

            if ((int) $previousRoleId !== (int) $role->id) {
                if (! $user->hasRole($role)) {
                    $user->assignRole($role);
                }

                $this->maybeRemoveOrphanedSpatieRole($assignment, $previousRoleId);
            }

            // Invalidate cached relations after role mutation.
            $user->unsetRelation('roles');
            $user->unsetRelation('permissions');

            return $assignment->fresh(['user', 'role', 'zone']);
        });
    }

    /**
     * @throws ValidationException
     */
    private function assertRoleBelongsToEstate(Role $role, int $estateId): void
    {
        if ($role->estate_id === null) {
            throw ValidationException::withMessages([
                'role' => 'Global roles cannot be used for administrative assignments.',
            ]);
        }

        if ((int) $role->estate_id !== $estateId) {
            throw ValidationException::withMessages([
                'role' => 'Role does not belong to the given estate.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertScopeIntegrity(AssignmentScope $scopeType, ?Zone $zone, int $estateId): void
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

            if ((int) $zone->estate_id !== $estateId) {
                throw ValidationException::withMessages([
                    'zone' => 'Zone does not belong to the given estate.',
                ]);
            }
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertPrimaryInvariant(AdministrativeAssignment $assignment, bool $isPrimary, bool $isActive): void
    {
        if (! $isPrimary || ! $isActive) {
            return;
        }

        $hasOtherPrimary = AdministrativeAssignment::query()
            ->where('user_id', $assignment->user_id)
            ->where('estate_id', $assignment->estate_id)
            ->where('is_primary', true)
            ->where('is_active', true)
            ->where('id', '!=', $assignment->id)
            ->exists();

        if ($hasOtherPrimary) {
            throw ValidationException::withMessages([
                'is_primary' => 'User already has an active primary assignment in this estate.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertNotDuplicate(AdministrativeAssignment $assignment, int $roleId, ?int $zoneId): void
    {
        $zoneIdCoalesced = $zoneId ?? 0;

        $isDuplicate = AdministrativeAssignment::query()
            ->where('user_id', $assignment->user_id)
            ->where('estate_id', $assignment->estate_id)
            ->where('role_id', $roleId)
            ->where('zone_id_coalesced', $zoneIdCoalesced)
            ->where('id', '!=', $assignment->id)
            ->exists();

        if ($isDuplicate) {
            throw ValidationException::withMessages([
                'assignment' => 'This administrative assignment already exists.',
            ]);
        }
    }

    /**
     * Remove the previous Spatie role only when no other active assignment still needs it.
     */
    private function maybeRemoveOrphanedSpatieRole(AdministrativeAssignment $assignment, int $previousRoleId): void
    {
        $stillNeeded = AdministrativeAssignment::query()
            ->where('user_id', $assignment->user_id)
            ->where('estate_id', $assignment->estate_id)
            ->where('role_id', $previousRoleId)
            ->where('is_active', true)
            ->where('id', '!=', $assignment->id)
            ->exists();

        if ($stillNeeded) {
            return;
        }

        $previousRole = Role::find($previousRoleId);

        if ($previousRole && $assignment->user->hasRole($previousRole)) {
            $assignment->user->removeRole($previousRole);
        }
    }
}
