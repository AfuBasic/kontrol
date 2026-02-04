<?php

namespace App\Actions\Admin;

use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use App\Services\EstateContextService;

class CreateRoleAction
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}
    /**
     * Create a new role for the current estate.
     *
     * @param  array{name: string, permissions?: array<int>}  $data
     */
    public function execute(array $data): Role
    {
        $estateId = $this->estateContext->getEstateId();

        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => 'web',
            'estate_id' => $estateId,
        ]);

        if (! empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        activity()
            ->performedOn($role)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estateId])
            ->log('created role ' . $role->name);

        return $role;
    }


}
