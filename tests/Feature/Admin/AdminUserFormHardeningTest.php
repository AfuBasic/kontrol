<?php

use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estate = Estate::factory()->create();
    $this->otherEstate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    foreach (['users.view', 'users.create', 'users.edit', 'users.delete'] as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }
    $adminRole->givePermissionTo(['users.view', 'users.create', 'users.edit', 'users.delete']);

    $this->admin->assignRole($adminRole);
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->estateRole = Role::create([
        'name' => 'estate_manager',
        'guard_name' => 'web',
        'estate_id' => $this->estate->id,
    ]);
});

it('rejects admin user form roles outside the active estate', function () {
    Role::create([
        'name' => 'foreign_manager',
        'guard_name' => 'web',
        'estate_id' => $this->otherEstate->id,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Foreign Role User',
            'email' => 'foreign-role@example.com',
            'role' => 'foreign_manager',
        ])
        ->assertSessionHasErrors(['role']);

    expect(User::query()->where('email', 'foreign-role@example.com')->exists())->toBeFalse();
});

it('rejects routed admin users outside the active estate', function () {
    $foreignUser = User::factory()->create([
        'name' => 'Other Estate Admin',
        'email' => 'other-admin@example.com',
    ]);
    $this->otherEstate->users()->attach($foreignUser->id, ['status' => 'accepted']);

    $this->actingAs($this->admin)
        ->get(route('admin.users.edit', $foreignUser->ulid))
        ->assertNotFound();

    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $foreignUser->ulid), [
            'name' => 'Mutated Name',
            'email' => 'mutated@example.com',
            'role' => $this->estateRole->name,
        ])
        ->assertNotFound();

    expect($foreignUser->fresh())
        ->name->toBe('Other Estate Admin')
        ->email->toBe('other-admin@example.com');
});
