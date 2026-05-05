<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Clear existing data
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('role_has_permissions')->truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('model_has_permissions')->truncate();
        DB::table('roles')->truncate();
        DB::table('permissions')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

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

        // 4. Assign all permissions to the global admin role
        $allPermissions = PermissionSeeder::getAllPermissionNames();
        $adminRole->syncPermissions($allPermissions);

        // 5. Assign specific permissions to other roles
        $securityRole->syncPermissions(['estate-board.view']);
        $residentRole->syncPermissions(['estate-board.view']);
        $hmRole->syncPermissions(['estate-board.view']);
    }
}
