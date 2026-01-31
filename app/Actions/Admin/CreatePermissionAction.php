<?php

namespace App\Actions\Admin;

use Spatie\Permission\Models\Permission;

class CreatePermissionAction
{
    /**
     * Create a new permission.
     *
     * @param  array{name: string}  $data
     */
    public function execute(array $data): Permission
    {
        return Permission::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);
    }
}
