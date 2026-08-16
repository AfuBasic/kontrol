<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed all permissions first
        $this->call(PermissionSeeder::class);

        // 2. Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 3. Create global roles
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'estate_id' => null]);
        $securityRole = Role::firstOrCreate(['name' => 'security', 'estate_id' => null]);
        $residentRole = Role::firstOrCreate(['name' => 'resident', 'estate_id' => null]);
        $hmRole = Role::firstOrCreate(['name' => 'household_member', 'estate_id' => null]);
        $affiliateRole = Role::firstOrCreate(['name' => 'affiliate', 'estate_id' => null]);
        $poRole = Role::firstOrCreate(['name' => 'property_owner', 'estate_id' => null]);

        // 4. Assign all permissions to the global admin role and all estate-scoped admin roles
        $allPermissions = PermissionSeeder::getAllPermissionNames();
        $adminRole->syncPermissions($allPermissions);

        Role::where('name', 'admin')->get()->each(function ($role) use ($allPermissions) {
            $role->syncPermissions($allPermissions);
        });

        // 5. Assign specific permissions to other roles
        $securityRole->syncPermissions(['estate-board.view', 'visitors.view']);
        $residentRole->syncPermissions(['estate-board.view']);
        $hmRole->syncPermissions(['estate-board.view']);
        $poRole->syncPermissions(['estate-board.view']);
    }
}
