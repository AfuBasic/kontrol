<?php

namespace App\Actions\Admin;

use Spatie\Permission\Models\Permission;

class DeletePermissionAction
{
    /**
     * Delete a permission.
     */
    public function execute(Permission $permission): void
    {
        $permission->delete();
    }
}
