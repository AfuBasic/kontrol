<?php

use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\EstateInviteLink;
use App\Models\AdministrativeAssignment;
use App\Enums\AssignmentScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Actions\Admin\CreateResidentAction;
use App\Actions\Admin\BulkInviteResidentsAction;
use App\Actions\Admin\ResendResidentInvitationAction;
use App\Actions\Invitation\AcceptInvitationAction;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed essential Spatie roles & permissions
    Role::create(['name' => 'admin']);
    Role::create(['name' => 'resident']);
    Role::create(['name' => 'property_owner']);

    Permission::create(['name' => 'residents.view']);
    Permission::create(['name' => 'residents.create']);
    Permission::create(['name' => 'residents.edit']);
    Permission::create(['name' => 'residents.reset-password']);

    Role::findByName('admin')->givePermissionTo([
        'residents.view',
        'residents.create',
        'residents.edit',
        'residents.reset-password',
    ]);

    $this->estate = Estate::factory()->create();
    $this->adminUser = User::factory()->create();

    // Context setting
    setPermissionsTeamId($this->estate->id);
    $this->adminUser->assignRole('admin');
    $this->adminUser->estates()->attach($this->estate->id, ['status' => 'accepted']);

    // Admin assignment for resolving context
    $role = Role::findByName('admin');
    AdministrativeAssignment::create([
        'user_id' => $this->adminUser->id,
        'estate_id' => $this->estate->id,
        'role_id' => $role->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
        'is_primary' => true,
    ]);
});

test('admin inviting a single resident stores full initiator provenance and invitation_id', function () {
    $this->actingAs($this->adminUser);

    $action = app(CreateResidentAction::class);
    $resident = $action->execute([
        'name' => 'John Doe',
        'email' => 'johndoe@example.com',
    ], $this->estate, 'single_form');

    $membership = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    expect($membership->created_via)->toBe('single_form');
    expect((int) $membership->initiated_by)->toBe($this->adminUser->id);
    expect($membership->initiated_at)->not->toBeNull();
    expect($membership->last_invited_by)->toBe($membership->initiated_by);
    expect($membership->last_invited_at)->toBe($membership->initiated_at);
    expect($membership->invitation_id)->not->toBeNull();
});

test('bulk invite resident stores bulk_upload created_via and import batch name', function () {
    $this->actingAs($this->adminUser);

    $action = app(BulkInviteResidentsAction::class);
    $result = $action->execute([
        'bulk1@example.com',
    ], $this->estate, null, 'bulk_upload');

    $resident = User::where('email', 'bulk1@example.com')->first();
    expect($resident)->not->toBeNull();

    $membership = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    expect($membership->created_via)->toBe('bulk_upload');
    expect($membership->import_batch)->toStartWith('Residents — ');
    expect((int) $membership->initiated_by)->toBe($this->adminUser->id);
});

test('resending invitation updates last_invited metadata', function () {
    $this->actingAs($this->adminUser);

    // Invite first
    $action = app(CreateResidentAction::class);
    $resident = $action->execute([
        'name' => 'Jane Doe',
        'email' => 'janedoe@example.com',
    ], $this->estate, 'single_form');

    $membershipBefore = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    // Sleep a split second to ensure time changes
    sleep(1);

    // Resend
    $resendAction = app(ResendResidentInvitationAction::class);
    $resendAction->execute($resident, $this->estate);

    $membershipAfter = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    expect($membershipAfter->last_invited_at)->not->toBe($membershipBefore->last_invited_at);
    expect((int) $membershipAfter->last_invited_by)->toBe($this->adminUser->id);
});

test('accepting invitation sets accepted_at timestamp', function () {
    $this->actingAs($this->adminUser);

    // Invite first
    $action = app(CreateResidentAction::class);
    $resident = $action->execute([
        'name' => 'Alice Doe',
        'email' => 'alicedoe@example.com',
    ], $this->estate, 'single_form');

    $invitation = \App\Models\Invitation::withoutGlobalScopes()
        ->where('email', 'alicedoe@example.com')
        ->first();

    expect($invitation)->not->toBeNull();

    // Accept invitation
    $acceptAction = app(AcceptInvitationAction::class);
    $acceptAction->execute($invitation->token, 'password123');

    $membership = DB::table('estate_users_membership')
        ->where('estate_id', $this->estate->id)
        ->where('user_id', $resident->id)
        ->first();

    expect($membership->status)->toBe('accepted');
    expect($membership->accepted_at)->not->toBeNull();
});

test('resident profile show page returns correct Inertia structure and provenance info', function () {
    $this->actingAs($this->adminUser);

    // Setup active estate session for Resolving Context middleware
    session(['current_estate_id' => $this->estate->id]);

    // Create resident
    $action = app(CreateResidentAction::class);
    $resident = $action->execute([
        'name' => 'Bob Doe',
        'email' => 'bobdoe@example.com',
    ], $this->estate, 'single_form');

    $response = $this->get("/admin/residents/{$resident->id}");

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Residents/Show')
        ->has('resident')
        ->has('provenance')
        ->has('residence')
        ->has('financials')
        ->has('activities')
        ->where('provenance.created_via', 'single_form')
        ->where('provenance.initiated_by_name', $this->adminUser->name)
    );
});
