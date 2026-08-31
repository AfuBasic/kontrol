<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'activity_logs.view',
            'suspicious_activity.view',
            'suspicious_activity.review',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['name' => $name, 'guard_name' => 'web']
            );
        }

        // Sync new permissions to all admin roles
        Role::where('name', 'admin')->get()->each(function (Role $role) use ($permissions): void {
            $role->givePermissionTo($permissions);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'activity_logs.view',
            'suspicious_activity.view',
            'suspicious_activity.review',
        ];

        Permission::whereIn('name', $permissions)->delete();
    }
};
