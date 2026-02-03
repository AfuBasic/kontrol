<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateRoleAction;
use App\Actions\Admin\DeleteRoleAction;
use App\Actions\Admin\UpdateRoleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Services\Admin\RoleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    public function index(): Response
    {
        $this->authorize('roles.view');
        return Inertia::render('admin/roles/index', [
            'roles' => $this->roleService->getManageableRoles(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('roles.create');
        return Inertia::render('admin/roles/create', [
            'permissions' => $this->roleService->getAvailablePermissions(),
        ]);
    }

    public function store(StoreRoleRequest $request, CreateRoleAction $action): RedirectResponse
    {
        $this->authorize('roles.create');
        $action->execute($request->validated());

        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        $this->authorize('roles.edit');
        
        // Ensure the role is manageable
        if ($this->roleService->isReservedRole($role->name)) {
            abort(403, 'This role cannot be edited.');
        }

        return Inertia::render('admin/roles/edit', [
            'role' => $role->load('permissions'),
            'permissions' => $this->roleService->getAvailablePermissions(),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role, UpdateRoleAction $action): RedirectResponse
    {
        $this->authorize('roles.edit');
        $action->execute($role, $request->validated());

        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role, DeleteRoleAction $action): RedirectResponse
    {
        $this->authorize('roles.delete');
        $action->execute($role);

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
