<?php

namespace App\Actions\Admin;

use App\Services\Admin\RoleService;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UpdateRoleAction
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /**
     * Update an existing role.
     *
     * @param  array{name: string, permissions?: array<int>}  $data
     */
    public function execute(Role $role, array $data): Role
    {
        if ($this->roleService->isReservedRole($role->name)) {
            throw new HttpException(403, 'This role cannot be modified.');
        }

        $role->update([
            'name' => $data['name'],
        ]);

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return $role->fresh();
    }
}
