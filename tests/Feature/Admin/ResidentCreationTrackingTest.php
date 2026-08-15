<?php

use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\EstateInviteLink;
use App\Enums\AssignmentScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Actions\Admin\CreateResidentAction;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed essential Spatie roles
    Role::create(['name' => 'admin']);
    Role::create(['name' => 'resident']);
    Role::create(['name' => 'property_owner']);

    Permission::create(['name' => 'property_owners.view']);
    Permission::create(['name' => 'property_owners.create']);
    Permission::create(['name' => 'residents.view']);
    Permission::create(['name' => 'residents.create']);
    Permission::create(['name' => 'residents.edit']);

    Role::findByName('admin')->givePermissionTo([
        'residents.create',
        'residents.edit',
    ]);

    $this->estate = Estate::factory()->create();
    $this->adminUser = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->adminUser->assignRole('admin');
    $this->adminUser->estates()->attach($this->estate->id, ['status' => 'accepted']);
});

test('admin inviting a resident sets created_via to admin_invite', function () {
    $this->actingAs($this->adminUser);

    $action = app(CreateResidentAction::class);
    $resident = $action->execute([
        'name' => 'New Resident',
        'email' => 'newres@example.com',
    ], $this->estate);

    $membership = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    expect($membership->created_via)->toBe('admin_invite');
});

test('property owner inviting a resident sets created_via to property_owner_invite', function () {
    // Create PO
    $owner = User::factory()->create();
    UserProfile::create(['user_id' => $owner->id]);
    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);

    // Mock Context
    $this->actingAs($owner);
    session(['current_estate_id' => $this->estate->id]);

    $response = $this->post(route('resident.property-owner.residents.store'), [
        'name' => 'PO Resident',
        'email' => 'pores@example.com',
        'phone' => '1234567890',
        'unit_number' => 'Block B',
        'address' => '456 Main St',
    ]);

    $response->assertRedirect();

    $resident = User::where('email', 'pores@example.com')->first();
    expect($resident)->not->toBeNull();

    $membership = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    expect($membership->created_via)->toBe('property_owner_invite');
});

test('self-registering via invite link sets created_via to invite_link and logs activity', function () {
    $link = EstateInviteLink::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->adminUser->id,
        'role' => 'resident',
        'token' => 'test-token-123',
        'is_active' => true,
        'usage_count' => 0,
        'requires_approval' => true,
    ]);

    $response = $this->post(route('invite.join.store', 'test-token-123'), [
        'name' => 'Self Reg Resident',
        'email' => 'selfreg@example.com',
    ]);

    $response->assertOk(); // JoinSuccess rendered

    $resident = User::where('email', 'selfreg@example.com')->first();
    expect($resident)->not->toBeNull();

    $membership = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    expect($membership->created_via)->toBe('invite_link');

    // Assert activity log is recorded
    $activity = Activity::where('description', 'like', '%self-registered%')->first();
    expect($activity)->not->toBeNull();
    expect($activity->properties['estate_id'])->toBe($this->estate->id);
    expect($activity->properties['invite_link_id'])->toBe($link->id);
});

test('property owner created invite links always force requires_approval to true', function () {
    // Create PO
    $owner = User::factory()->create();
    UserProfile::create(['user_id' => $owner->id]);
    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);

    // Act as PO
    $this->actingAs($owner);
    session(['current_estate_id' => $this->estate->id]);

    $response = $this->post(route('resident.property-owner.residents.invite-link.store'), [
        'max_usages' => 5,
        'requires_approval' => false, // Attempt to bypass approval
        'expires_at' => now()->addDays(5)->toDateString(),
    ]);

    $response->assertRedirect();

    $link = EstateInviteLink::where('estate_id', $this->estate->id)
        ->where('user_id', $owner->id)
        ->where('role', 'resident')
        ->first();

    expect($link)->not->toBeNull();
    expect($link->requires_approval)->toBeTrue(); // Enforced true by backend
});
