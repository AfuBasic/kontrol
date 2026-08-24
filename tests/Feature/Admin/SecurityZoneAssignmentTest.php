<?php

use App\Actions\Admin\CreateSecurityAction;
use App\Enums\AssignmentScope;
use App\Events\Admin\SecurityCreated;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();
    foreach (['security.view', 'security.create', 'security.edit'] as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

    $this->adminAssignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    $this->zone = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone 1']);
});

it('invites security personnel with a zone assignment on the invitation', function () {
    Event::fake([SecurityCreated::class]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.security.store'), [
            'name' => 'Gate Guard',
            'email' => 'guard@example.com',
            'zone_id' => $this->zone->id,
        ])
        ->assertRedirect(route('admin.security.index'));

    $guard = User::query()->where('email', 'guard@example.com')->first();

    expect($guard)->not->toBeNull();

    $this->assertDatabaseHas('estate_users_membership', [
        'user_id' => $guard->id,
        'estate_id' => $this->estate->id,
        'relationship_type' => 'security',
        'zone_id' => $this->zone->id,
    ]);

    $this->assertDatabaseHas('invitations', [
        'email' => 'guard@example.com',
        'estate_id' => $this->estate->id,
        'relationship_type' => 'security',
        'zone_id' => $this->zone->id,
        'scope_type' => AssignmentScope::Zone->value,
    ]);
});

it('creates a zone-scoped assignment when an accepted member is added as security', function () {
    $existing = User::factory()->create();
    $this->estate->users()->attach($existing->id, [
        'status' => 'accepted',
        'relationship_type' => 'resident',
    ]);

    $this->actingAs($this->admin);

    app(CreateSecurityAction::class)->execute([
        'name' => $existing->name,
        'email' => $existing->email,
        'zone_id' => $this->zone->id,
    ], $this->estate);

    $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();

    $assignment = AdministrativeAssignment::query()
        ->where('user_id', $existing->id)
        ->where('estate_id', $this->estate->id)
        ->where('role_id', $securityRole->id)
        ->first();

    expect($assignment)->not->toBeNull()
        ->and($assignment->scope_type)->toBe(AssignmentScope::Zone)
        ->and($assignment->zone_id)->toBe($this->zone->id);
});

it('passes zones to the security create page', function () {
    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.security.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Security/Create')
            ->has('zones', 1)
            ->where('zones.0.name', 'Zone 1'));
});

it('lists an existing user in security index after being invited as security', function () {
    $existing = User::factory()->create(['email' => 'existing_security@example.com']);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.security.store'), [
            'name' => $existing->name,
            'email' => $existing->email,
            'badge_number' => 'SEC-999',
        ])
        ->assertRedirect(route('admin.security.index'));

    $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();

    $assignment = AdministrativeAssignment::query()
        ->where('user_id', $existing->id)
        ->where('estate_id', $this->estate->id)
        ->where('role_id', $securityRole->id)
        ->first();

    expect($assignment)->not->toBeNull();

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.security.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Security/Index')
            ->where('stats.total', 1)
            ->where('stats.pending', 1));
});

it('bulk invites security personnel via paste or csv and lists them with pending status', function () {
    Event::fake([SecurityCreated::class]);

    $emails = ['bulk_sec1@example.com', 'bulk_sec2@example.com'];

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.security.bulk-invite'), [
            'emails' => $emails,
            'zone_id' => $this->zone->id,
        ])
        ->assertRedirect(route('admin.security.index'))
        ->assertSessionHas('success');

    Event::assertDispatched(SecurityCreated::class, 2);

    $this->assertDatabaseHas('estate_users_membership', [
        'estate_id' => $this->estate->id,
        'relationship_type' => 'security',
        'zone_id' => $this->zone->id,
        'status' => 'pending',
    ]);

    $this->assertDatabaseHas('invitations', [
        'email' => 'bulk_sec1@example.com',
        'estate_id' => $this->estate->id,
        'relationship_type' => 'security',
        'status' => 'pending',
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.security.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Security/Index')
            ->where('stats.total', 2)
            ->where('stats.pending', 2));
});

it('sends an invitation email when adding security role to an existing resident', function () {
    Event::fake([SecurityCreated::class]);

    // 1. Create an existing accepted resident
    $resident = User::factory()->create(['email' => 'resident_turned_guard@example.com']);
    $this->estate->users()->attach($resident->id, [
        'status' => 'accepted',
        'relationship_type' => 'resident',
    ]);

    // 2. Invite the resident as security
    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.security.store'), [
            'name' => $resident->name,
            'email' => $resident->email,
            'badge_number' => 'SEC-DUAL-1',
        ])
        ->assertRedirect(route('admin.security.index'));

    // 3. Verify event was dispatched
    Event::assertDispatched(SecurityCreated::class, function ($event) use ($resident) {
        return $event->user->email === $resident->email;
    });

    // 4. Verify invitation record exists with valid pending token
    $this->assertDatabaseHas('invitations', [
        'email' => $resident->email,
        'estate_id' => $this->estate->id,
        'relationship_type' => 'security',
        'status' => 'pending',
    ]);
});

it('rejects verified security personnel email changes on update', function () {
    $guard = User::factory()->create([
        'email' => 'verified.guard@example.com',
        'email_verified_at' => now(),
    ]);

    setPermissionsTeamId($this->estate->id);
    $guard->assignRole('security');
    $this->estate->users()->attach($guard->id, [
        'status' => 'accepted',
        'relationship_type' => 'security',
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->put(route('admin.security.update', $guard), [
            'name' => $guard->name,
            'email' => 'changed.guard@example.com',
            'phone' => '',
            'badge_number' => '',
        ])
        ->assertSessionHasErrors('email');

    expect($guard->fresh()->email)->toBe('verified.guard@example.com');
});
