<?php

namespace App\Actions\Admin;

use Spatie\Permission\Models\Permission;

class UpdatePermissionAction
{
    /**
     * Update an existing permission.
     *
     * @param  array{name: string}  $data
     */
    public function execute(Permission $permission, array $data): Permission
    {
        $permission->update([
            'name' => $data['name'],
        ]);

        return $permission->fresh();
    }
}
