<?php

namespace App\Services\Admin;

use App\Models\AdministrativeAssignment;
use App\Services\EstateContextService;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleService
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Get roles that can be managed by the current user.
     * Excludes reserved system roles.
     */
    public function getManageableRoles(): Collection
    {
        $estateId = $this->estateContext->getEstateId();

        return Role::query()
            ->with('permissions')
            ->where('estate_id', $estateId)
            ->whereNotIn('name', RoleSeeder::RESERVED_ROLES)
            ->addSelect([
                'assignments_count' => AdministrativeAssignment::selectRaw('count(*)')
                    ->whereColumn('role_id', 'roles.id')
                    ->where('estate_id', $estateId),
            ])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get roles that can be assigned to users in the estate.
     * Includes both custom estate roles and specific system roles (admin, security).
     */
    public function getAssignableRoles(): Collection
    {
        $estateId = $this->estateContext->getEstateId();

        // Assignable roles include the estate's custom roles and the global 'admin' and 'security' roles
        return Role::query()
            ->where(function ($query) use ($estateId) {
                $query->where('estate_id', $estateId)
                    ->orWhere(function ($q) {
                        $q->whereNull('estate_id')
                            ->whereIn('name', ['admin', 'security']);
                    });
            })
            ->orderBy('name')
            ->get();
    }

    /**
     * Get all available permissions.
     */
    public function getAvailablePermissions(): Collection
    {
        return Permission::orderBy('name')->get();
    }

    /**
     * Check if a role name is reserved.
     */
    public function isReservedRole(string $name): bool
    {
        return in_array(strtolower($name), array_map('strtolower', RoleSeeder::RESERVED_ROLES));
    }

    /**
     * Check if a role is a global role (not estate-scoped).
     */
    public function isGlobalRole(string $name): bool
    {
        return in_array(strtolower($name), array_map('strtolower', RoleSeeder::GLOBAL_ROLES));
    }
}
