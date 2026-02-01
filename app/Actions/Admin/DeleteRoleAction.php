<?php

namespace App\Actions\Admin;

use App\Services\Admin\RoleService;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeleteRoleAction
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /**
     * Delete a role.
     */
    public function execute(Role $role): void
    {
        if ($this->roleService->isReservedRole($role->name)) {
            throw new HttpException(403, 'This role cannot be deleted.');
        }

        activity()
            ->performedOn($role)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $role->estate_id])
            ->log('deleted role ' . $role->name);

        $role->delete();
    }
}
