<?php

namespace App\Actions\Admin;

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class CreateAdministrativeAssignmentAction
{
    /**
     * Create an authoritative administrative assignment, enforcing all domain invariants.
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
        // 1. Role Scope Invariant
        if ($role->estate_id === null) {
            throw ValidationException::withMessages([
                'role' => 'Global roles cannot be used for administrative assignments.',
            ]);
        }
        
        if ($role->estate_id !== $estate->id) {
            throw ValidationException::withMessages([
                'role' => 'Role does not belong to the given estate.',
            ]);
        }
        
        // 2. Zone Scope Invariant
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
            if ($zone->estate_id !== $estate->id) {
                throw ValidationException::withMessages([
                'zone' => 'Zone does not belong to the given estate.',
                ]);
            }
        }
        
        // 3. User Membership Invariant
        $hasMembership = $user->estates()
            ->where('estates.id', $estate->id)
            ->wherePivot('status', 'accepted')
            ->exists();
            
        if (! $hasMembership) {
            throw ValidationException::withMessages([
                'user' => 'User is not a verified member of this estate.',
            ]);
        }
        
        // 4. Primary Assignment Invariant
        if ($isPrimary && $isActive) {
            $hasPrimary = AdministrativeAssignment::where('user_id', $user->id)
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
        
        // 5. Duplicate Assignment Invariant
        $zoneIdCoalesced = $zone ? $zone->id : 0;
        $isDuplicate = AdministrativeAssignment::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->where('role_id', $role->id)
            ->where('zone_id_coalesced', $zoneIdCoalesced)
            ->exists();
            
        if ($isDuplicate) {
            throw ValidationException::withMessages([
                'assignment' => 'This administrative assignment already exists.',
            ]);
        }

        return AdministrativeAssignment::create([
            'user_id' => $user->id,
            'estate_id' => $estate->id,
            'role_id' => $role->id,
            'scope_type' => $scopeType,
            'zone_id' => $zone?->id,
            'is_primary' => $isPrimary,
            'is_active' => $isActive,
        ]);
    }
}
