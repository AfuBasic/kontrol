<?php

namespace Tests\Feature\Authorization;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\Incident;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup generic estate and roles
    $this->estateA = Estate::factory()->create(['name' => 'Estate A']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate B']);

    $this->zone1 = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone 1']);
    $this->zone2 = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone 2']);
    $this->zone3 = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone 3']);

    // Roles
    $this->adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->securityRole = Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
    $this->residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    // Admin for Estate A
    $this->estateAdmin = User::factory()->create();
    EstateMembership::create(['user_id' => $this->estateAdmin->id, 'estate_id' => $this->estateA->id, 'status' => 'accepted']);
    $this->adminAssignment = AdministrativeAssignment::create([
        'user_id' => $this->estateAdmin->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    // Zone 1 Security
    $this->zone1Security = User::factory()->create();
    EstateMembership::create(['user_id' => $this->zone1Security->id, 'estate_id' => $this->estateA->id, 'status' => 'accepted']);
    $this->zone1Assignment = AdministrativeAssignment::create([
        'user_id' => $this->zone1Security->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zone1->id,
        'role_id' => $this->securityRole->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    // Setup Data
    $this->zone1Incident = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zone1->id,
        'reporter_id' => $this->estateAdmin->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Zone 1 Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $this->zone2Incident = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zone2->id,
        'reporter_id' => $this->estateAdmin->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Zone 2 Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $this->estateBIncident = Incident::create([
        'estate_id' => $this->estateB->id,
        'reporter_id' => $this->estateAdmin->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Estate B Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);
});

it('enforces basic zone isolation (Test 1)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    $incidents = Incident::all();

    expect($incidents)->toHaveCount(1)
        ->and($incidents->first()->id)->toBe($this->zone1Incident->id);
})->group('zone_isolation');

it('prevents cross-zone id lookup (Test 2)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    $incident = Incident::find($this->zone2Incident->id);

    expect($incident)->toBeNull();
})->group('zone_isolation');

it('prevents cross-estate id lookup (Test 3)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    $incident = Incident::find($this->estateBIncident->id);

    expect($incident)->toBeNull();
})->group('zone_isolation');

it('allows estate-wide admin access to all zones (Test 4)', function () {
    Auth::login($this->estateAdmin);
    app(ContextManager::class)->activate($this->adminAssignment);

    $incidents = Incident::all();

    expect($incidents)->toHaveCount(2)
        ->and($incidents->pluck('id')->toArray())
        ->toContain($this->zone1Incident->id, $this->zone2Incident->id)
        ->not->toContain($this->estateBIncident->id);
})->group('zone_isolation');

it('secures eager loading against cross-zone data (Test 5)', function () {
    // We'll create a User that has both properties, but we should only see the zone 1 property when eager loaded
    $user = User::factory()->create();

    $prop1 = Property::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zone1->id,
        'property_owner_id' => $user->id,
        'name' => 'Zone 1 Prop',
    ]);

    $prop2 = Property::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zone2->id,
        'property_owner_id' => $user->id,
        'name' => 'Zone 2 Prop',
    ]);

    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    $userModel = User::with('properties')->find($user->id);

    expect($userModel->properties)->toHaveCount(1)
        ->and($userModel->properties->first()->id)->toBe($prop1->id);
})->group('zone_isolation');

it('filters aggregates properly (Test 6)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    expect(Incident::count())->toBe(1);
    expect(Incident::where('status', 'pending')->count())->toBe(1);
})->group('zone_isolation');

it('filters chunking and pagination (Test 7 & 8)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    $paginated = Incident::paginate();
    expect($paginated->total())->toBe(1);

    $chunkCount = 0;
    Incident::chunk(10, function ($incidents) use (&$chunkCount) {
        $chunkCount += $incidents->count();
    });

    expect($chunkCount)->toBe(1);
})->group('zone_isolation');

it('blocks mutations to cross-zone resources (Test 9)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    $updated = Incident::whereKey($this->zone2Incident->id)->update(['title' => 'Hacked']);
    expect($updated)->toBe(0);

    // Ensure DB still has old title
    $dbIncident = DB::table('incidents')->where('id', $this->zone2Incident->id)->first();
    expect($dbIncident->title)->toBe('Zone 2 Incident');
})->group('zone_isolation');

it('safely changes context (Test 12 & 13)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    expect(Incident::count())->toBe(1);

    // Now assume user switches to an Estate B assignment
    $estateBUser = User::factory()->create();
    EstateMembership::create(['user_id' => $estateBUser->id, 'estate_id' => $this->estateB->id, 'status' => 'accepted']);
    $assignmentB = AdministrativeAssignment::create([
        'user_id' => $estateBUser->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    Auth::login($estateBUser);
    app(ContextManager::class)->activate($assignmentB);

    $incidents = Incident::all();
    expect($incidents)->toHaveCount(1)
        ->and($incidents->first()->id)->toBe($this->estateBIncident->id);
})->group('zone_isolation');

it('blocks parameter spoofing from changing zone context (Test 14)', function () {
    Auth::login($this->zone1Security);
    app(ContextManager::class)->activate($this->zone1Assignment);

    // Simulate request setting zone_id parameter to zone 2
    request()->merge(['zone_id' => $this->zone2->id]);

    // Query should still use ContextManager (zone 1)
    expect(Incident::count())->toBe(1)
        ->and(Incident::first()->id)->toBe($this->zone1Incident->id);
})->group('zone_isolation');
