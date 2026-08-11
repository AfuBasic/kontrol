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
        $this->authorize('viewAny', Role::class);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $this->roleService->getManageableRoles(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Role::class);

        return Inertia::render('Admin/Roles/Create', [
            'permissions' => $this->roleService->getAvailablePermissions(),
        ]);
    }

    public function store(StoreRoleRequest $request, CreateRoleAction $action): RedirectResponse
    {
        $this->authorize('create', Role::class);
        $action->execute($request->validated());

        return redirect()->route('admin.roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        $this->authorize('update', $role);

        // Ensure the role is manageable
        if ($this->roleService->isReservedRole($role->name)) {
            abort(403, 'This role cannot be edited.');
        }

        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role->load('permissions'),
            'permissions' => $this->roleService->getAvailablePermissions(),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role, UpdateRoleAction $action): RedirectResponse
    {
        $this->authorize('update', $role);
        $action->execute($role, $request->validated());

        return redirect()->route('admin.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role, DeleteRoleAction $action): RedirectResponse
    {
        $this->authorize('delete', $role);
        $action->execute($role);

        return redirect()->route('admin.roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
