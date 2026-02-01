<?php

namespace App\Actions\Admin;

use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class CreateRoleAction
{
    /**
     * Create a new role for the current estate.
     *
     * @param  array{name: string, permissions?: array<int>}  $data
     */
    public function execute(array $data): Role
    {
        $estateId = $this->getCurrentEstateId();

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

    protected function getCurrentEstateId(): ?int
    {
        $user = Auth::user();

        if (! $user) {
            return null;
        }

        $estate = $user->estates()
            ->wherePivot('status', 'accepted')
            ->first();

        return $estate?->id;
    }
}
