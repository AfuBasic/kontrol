<?php

namespace App\Services\Admin;

use Database\Seeders\RoleSeeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

use App\Services\EstateContextService;

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
