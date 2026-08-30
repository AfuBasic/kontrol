<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\ImpersonationSession;
use App\Models\User;
use App\Services\Zeus\ImpersonationService;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('guests are redirected to zeus login when accessing impersonation page', function () {
    $estate = Estate::factory()->create();

    $response = $this->get(route('zeus.estates.impersonate', $estate));

    $response->assertRedirect(route('zeus.login'));
});

test('zeus admin sees only active legitimate estate admins on impersonation page', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create(['name' => 'Emerald Valley']);

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    // 1. Legitimate active admin
    $adminUser = User::factory()->create(['name' => 'Tunde Bakare', 'email' => 'tunde@example.com']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    // 2. Inactive admin (should be excluded)
    $inactiveAdmin = User::factory()->create(['name' => 'Inactive Admin']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $inactiveAdmin->id,
        'status' => 'accepted',
    ]);
    AdministrativeAssignment::create([
        'user_id' => $inactiveAdmin->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => false,
    ]);

    // 3. Resident (should be excluded)
    $residentUser = User::factory()->create(['name' => 'Ordinary Resident']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $residentUser->id,
        'status' => 'accepted',
    ]);
    AdministrativeAssignment::create([
        'user_id' => $residentUser->id,
        'estate_id' => $estate->id,
        'role_id' => $residentRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    // 4. Admin of another estate (should be excluded)
    $otherEstate = Estate::factory()->create();
    $otherAdmin = User::factory()->create(['name' => 'Foreign Admin']);
    EstateMembership::create([
        'estate_id' => $otherEstate->id,
        'user_id' => $otherAdmin->id,
        'status' => 'accepted',
    ]);
    AdministrativeAssignment::create([
        'user_id' => $otherAdmin->id,
        'estate_id' => $otherEstate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->get(route('zeus.estates.impersonate', $estate));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Zeus/Estates/Impersonate')
        ->where('estate.id', $estate->id)
        ->where('estate.name', 'Emerald Valley')
        ->has('admins', 1)
        ->has('admins.0', fn (Assert $a) => $a
            ->where('id', $adminUser->id)
            ->where('name', 'Tunde Bakare')
            ->where('email', 'tunde@example.com')
            ->where('role', 'admin')
            ->etc()
        )
    );
});

test('zeus admin sees empty state when estate has no administrators', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create();

    $response = $this->withSession([$sessionKey => true])
        ->get(route('zeus.estates.impersonate', $estate));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Zeus/Estates/Impersonate')
        ->has('admins', 0)
    );
});

test('zeus admin can start impersonation and enters support mode as target admin', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create(['name' => 'Oakwood Heights']);
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $adminUser = User::factory()->create(['name' => 'Ada Lovelace', 'email' => 'ada@example.com']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->post(route('zeus.estates.impersonate.start', $estate), [
            'user_id' => $adminUser->id,
            'reason' => 'Troubleshooting onboarding issue',
        ]);

    $response->assertRedirect(route('admin.dashboard'));

    // Verify session state
    $this->assertDatabaseHas('impersonation_sessions', [
        'effective_user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'reason' => 'Troubleshooting onboarding issue',
        'ended_at' => null,
    ]);

    $session = ImpersonationSession::query()->where('effective_user_id', $adminUser->id)->first();
    expect($session)->not->toBeNull();

    // Verify subsequent request to admin dashboard has support mode shared props
    $adminResponse = $this->withSession([
        $sessionKey => true,
        ImpersonationService::SESSION_ID_KEY => $session->id,
        ImpersonationService::ESTATE_ID_KEY => $estate->id,
        ImpersonationService::USER_ID_KEY => $adminUser->id,
        'active_context_assignment_id' => $assignment->id,
    ])->get(route('admin.dashboard'));

    $adminResponse->assertOk();
    $adminResponse->assertInertia(fn (Assert $page) => $page
        ->has('support_mode', fn (Assert $sm) => $sm
            ->where('active', true)
            ->where('estate.id', $estate->id)
            ->where('estate.name', 'Oakwood Heights')
            ->where('operating_as.id', $adminUser->id)
            ->where('operating_as.name', 'Ada Lovelace')
            ->etc()
        )
    );
});

test('starting impersonation fails when target user is not an active admin for the estate', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create();
    $nonAdmin = User::factory()->create();

    $response = $this->withSession([$sessionKey => true])
        ->post(route('zeus.estates.impersonate.start', $estate), [
            'user_id' => $nonAdmin->id,
        ]);

    $response->assertSessionHasErrors('user_id');
    $this->assertDatabaseCount('impersonation_sessions', 0);
});

test('stopping impersonation ends session and redirects back to zeus estate detail', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $adminUser = User::factory()->create();
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $impersonationSession = ImpersonationSession::create([
        'provider_identifier' => 'zeus',
        'effective_user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'session_id' => 'test-session-123',
        'started_at' => now(),
    ]);

    $response = $this->withSession([
        $sessionKey => true,
        ImpersonationService::SESSION_ID_KEY => $impersonationSession->id,
        ImpersonationService::ESTATE_ID_KEY => $estate->id,
        ImpersonationService::USER_ID_KEY => $adminUser->id,
        'active_context_assignment_id' => $assignment->id,
    ])->post(route('zeus.impersonation.stop'));

    $response->assertRedirect(route('zeus.estates.show', $estate));

    $impersonationSession->refresh();
    expect($impersonationSession->ended_at)->not->toBeNull();
});

test('sensitive security actions are blocked during support mode', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $adminUser = User::factory()->create();
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $impersonationSession = ImpersonationSession::create([
        'provider_identifier' => 'zeus',
        'effective_user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'session_id' => 'test-session-sensitive',
        'started_at' => now(),
    ]);

    // Attempting to delete the effective admin user
    $response = $this->actingAs($adminUser)->withSession([
        $sessionKey => true,
        ImpersonationService::SESSION_ID_KEY => $impersonationSession->id,
        ImpersonationService::ESTATE_ID_KEY => $estate->id,
        ImpersonationService::USER_ID_KEY => $adminUser->id,
        'active_context_assignment_id' => $assignment->id,
    ])->delete(route('admin.users.destroy', $adminUser));

    $response->assertForbidden();
});

test('zeus admin can repeatedly start, exit, and re-start impersonation without session or csrf corruption', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create(['name' => 'Highland Park']);
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $adminUser = User::factory()->create(['name' => 'Boluwatife Adeleke']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    // 1. First Impersonation Cycle
    $start1 = $this->withSession([$sessionKey => true])
        ->post(route('zeus.estates.impersonate.start', $estate), [
            'user_id' => $adminUser->id,
            'reason' => 'Cycle 1',
        ]);
    $start1->assertRedirect(route('admin.dashboard'));
    $this->assertDatabaseHas('impersonation_sessions', [
        'effective_user_id' => $adminUser->id,
        'ended_at' => null,
    ]);

    // 2. Exit Support Mode
    $exit1 = $this->post(route('zeus.impersonation.stop'));
    $exit1->assertRedirect(route('zeus.estates.show', $estate));
    $this->assertDatabaseMissing('impersonation_sessions', [
        'effective_user_id' => $adminUser->id,
        'ended_at' => null,
    ]);

    // 3. Second Impersonation Cycle (immediately re-start)
    $start2 = $this->post(route('zeus.estates.impersonate.start', $estate), [
        'user_id' => $adminUser->id,
        'reason' => 'Cycle 2',
    ]);
    $start2->assertRedirect(route('admin.dashboard'));
    $this->assertDatabaseHas('impersonation_sessions', [
        'effective_user_id' => $adminUser->id,
        'reason' => 'Cycle 2',
        'ended_at' => null,
    ]);
});
