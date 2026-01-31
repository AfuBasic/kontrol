<?php

namespace App\Services\Admin;

use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;

class PermissionService
{
    /**
     * Get all permissions.
     */
    public function getAllPermissions(): Collection
    {
        return Permission::orderBy('name')->get();
    }

    /**
     * Get permissions grouped by resource.
     */
    public function getPermissionsGrouped(): Collection
    {
        return Permission::orderBy('name')
            ->get()
            ->groupBy(function (Permission $permission) {
                // Group by the first part of the permission name (e.g., "users" from "users.create")
                $parts = explode('.', $permission->name);

                return $parts[0] ?? 'other';
            });
    }
}
