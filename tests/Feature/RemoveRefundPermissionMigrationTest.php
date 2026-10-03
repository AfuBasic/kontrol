<?php

use App\Models\Estate;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function removeRefundPermission(): void
{
    (require database_path('migrations/2026_10_02_190000_remove_the_refund_permission.php'))->up();
}

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('no longer seeds the refund permission', function () {
    expect(Permission::where('name', 'transactions.refund')->exists())->toBeFalse();
});

it('removes a leftover refund permission from the database and from everyone who held it', function () {
    $estate = Estate::factory()->create();
    setPermissionsTeamId($estate->id);

    $leftover = Permission::create(['name' => 'transactions.refund', 'guard_name' => 'web']);
    $role = Role::create(['name' => 'finance-lead', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    $role->givePermissionTo($leftover);
    $user = User::factory()->create();
    $user->givePermissionTo($leftover);

    removeRefundPermission();

    expect(Permission::where('name', 'transactions.refund')->exists())->toBeFalse()
        ->and($role->fresh()->permissions->pluck('name')->all())->not->toContain('transactions.refund')
        ->and($user->fresh()->getDirectPermissions()->pluck('name')->all())->not->toContain('transactions.refund');
});

it('leaves every other permission untouched', function () {
    $before = Permission::count();

    removeRefundPermission();

    expect(Permission::count())->toBe($before)
        ->and(Permission::where('name', 'transactions.view')->exists())->toBeTrue();
});

it('is safe to run when the permission is already gone', function () {
    removeRefundPermission();
    removeRefundPermission();

    expect(Permission::where('name', 'transactions.refund')->exists())->toBeFalse();
});
