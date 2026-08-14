<?php

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup users, estates, zones, roles
    $this->user = User::factory()->create();

    $this->estateA = Estate::factory()->create();
    $this->zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);
    $this->zoneB = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone B']);

    $this->estateB = Estate::factory()->create();
    $this->zoneA_B = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Zone A in Estate B']);

    // Assignments
    $this->roleAdmin = Role::create(['name' => 'admin', 'estate_id' => $this->estateA->id, 'guard_name' => 'web']);
    $this->roleResident = Role::create(['name' => 'resident', 'estate_id' => $this->estateA->id, 'guard_name' => 'web']);

    $this->user->estates()->attach($this->estateA->id, ['status' => 'accepted']);

    // Context Manager
    $this->contextManager = app(ContextManager::class);

    // Helper to create a request with session attached
    $this->makeRequest = function () {
        $request = Request::create('/', 'GET');
        $request->setLaravelSession($this->app['session']->driver());
        $request->setUserResolver(fn () => $this->user);

        return $request;
    };

    // Create target records (Invitations)
    // Estate A, Zone A
    $this->invitationA = Invitation::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'email' => 'a@example.com',
        'status' => 'pending',
        'token' => Str::random(32),
    ]);

    // Estate A, Zone B
    $this->invitationB = Invitation::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneB->id,
        'email' => 'b@example.com',
        'status' => 'pending',
        'token' => Str::random(32),
    ]);

    // Estate B, Zone A_B (Same zone ID trick)
    $this->invitationCross = Invitation::create([
        'estate_id' => $this->estateB->id,
        'zone_id' => $this->zoneA->id, // Physically same ID (or we can just force the id below)
        'email' => 'cross@example.com',
        'status' => 'pending',
        'token' => Str::random(32),
    ]);
});

it('Test 1 — Zone A cannot see Zone B', function () {
    // Activate Zone A context
    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'scope_type' => 'zone',
        'role_id' => $this->roleResident->id,
        'is_primary' => true,
        'is_active' => true,
    ]);
    Auth::login($this->user);
    $this->contextManager->activate($assignment);
    $this->contextManager->resolve(($this->makeRequest)());

    $results = Invitation::all();

    expect($results->pluck('id')->toArray())
        ->toContain($this->invitationA->id)
        ->not->toContain($this->invitationB->id);
});

it('Test 2 — Direct lookup cannot bypass', function () {
    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'scope_type' => 'zone',
        'role_id' => $this->roleResident->id,
        'is_primary' => true,
        'is_active' => true,
    ]);
    Auth::login($this->user);
    $this->contextManager->activate($assignment);
    $this->contextManager->resolve(($this->makeRequest)());

    // Try to find Zone B invitation directly
    $found = Invitation::find($this->invitationB->id);
    expect($found)->toBeNull();
});

it('Test 3 — Estate admin sees all zones', function () {
    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => null, // Estate scoped
        'scope_type' => 'estate',
        'role_id' => $this->roleAdmin->id,
        'is_primary' => true,
        'is_active' => true,
    ]);
    Auth::login($this->user);
    $this->contextManager->activate($assignment);
    $this->contextManager->resolve(($this->makeRequest)());

    $results = Invitation::all();

    expect($results->pluck('id')->toArray())
        ->toContain($this->invitationA->id)
        ->toContain($this->invitationB->id)
        ->not->toContain($this->invitationCross->id); // Must not see Estate B's stuff
});

it('Test 4 — Cross-estate same-zone ID', function () {
    // Manually force $this->zoneA_B to have same ID as $this->zoneA but in Estate B
    // Wait, the DB auto-increments. Let's just create an invitation in Estate B with zone_id matching zone A's ID
    $cross = Invitation::create([
        'estate_id' => $this->estateB->id,
        'zone_id' => $this->zoneA->id, // Mismatch trick
        'email' => 'trick@example.com',
        'status' => 'pending',
        'token' => Str::random(32),
    ]);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'scope_type' => 'zone',
        'role_id' => $this->roleResident->id,
        'is_primary' => true,
        'is_active' => true,
    ]);
    Auth::login($this->user);
    $this->contextManager->activate($assignment);
    $this->contextManager->resolve(($this->makeRequest)());

    $results = Invitation::all();

    // We should only see Estate A, Zone A
    expect($results->pluck('id')->toArray())
        ->toContain($this->invitationA->id)
        ->not->toContain($cross->id);
});

it('Test 5 — No context', function () {
    // Auth::login not called, no active session assignment
    $results = Invitation::all();

    // Should fail closed and return 0 results
    expect($results->count())->toBe(0);
});

it('Test 6 — Invalid context', function () {
    // Setup an assignment but make it invalid by deactivating
    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'scope_type' => 'zone',
        'role_id' => $this->roleResident->id,
        'is_primary' => true,
        'is_active' => false, // inactive!
    ]);
    Auth::login($this->user);

    // We can't use activate() because it will throw exception, so we simulate session residue
    session(['active_context_assignment_id' => $assignment->id]);
    $this->contextManager->resolve(($this->makeRequest)());

    $results = Invitation::all();

    // Should fail closed
    expect($results->count())->toBe(0);
});

it('Test 7 — Relationship leakage', function () {
    // Assuming Estate hasMany Invitations
    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'scope_type' => 'zone',
        'role_id' => $this->roleResident->id,
        'is_primary' => true,
        'is_active' => true,
    ]);
    Auth::login($this->user);
    $this->contextManager->activate($assignment);
    $this->contextManager->resolve(($this->makeRequest)());

    $estate = Estate::find($this->estateA->id);

    // Test the relationship. It should apply the scope!
    $results = $estate->invitations;

    expect($results->pluck('id')->toArray())
        ->toContain($this->invitationA->id)
        ->not->toContain($this->invitationB->id);
});

it('Test 8 — Eager loading', function () {
    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'scope_type' => 'zone',
        'role_id' => $this->roleResident->id,
        'is_primary' => true,
        'is_active' => true,
    ]);
    Auth::login($this->user);
    $this->contextManager->activate($assignment);
    $this->contextManager->resolve(($this->makeRequest)());

    // Eager load invitations on the estate
    $estates = Estate::with('invitations')->where('id', $this->estateA->id)->get();
    $estate = $estates->first();

    expect($estate->invitations->pluck('id')->toArray())
        ->toContain($this->invitationA->id)
        ->not->toContain($this->invitationB->id);
});

it('Test 10 — Explicit bypass', function () {
    $results = Invitation::withoutGlobalScope(ZoneScope::class)->get();
    expect($results->count())->toBeGreaterThan(0);
});
