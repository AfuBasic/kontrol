<?php

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use App\Services\EstateContextService;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->estateA = Estate::factory()->create(['name' => 'Estate A']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate B']);
    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);

    // Setup global scoped roles
    $this->adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => null]);
    $this->residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => null]);
    $this->securityRole = Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web', 'estate_id' => null]);

    $this->user = User::factory()->create();

    EstateMembership::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
    ]);

    EstateMembership::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateB->id,
        'status' => 'accepted',
    ]);

    // User is Admin in Estate A
    $this->assignmentA = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
    setPermissionsTeamId($this->estateA->id);
    $this->user->assignRole($this->adminRole);

    // User is Resident in Estate B
    $this->assignmentB = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->residentRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
    setPermissionsTeamId($this->estateB->id);
    $this->user->assignRole($this->residentRole);
});

it('prevents Spatie cache leakage across estate contexts', function () {
    $contextManager = app(ContextManager::class);

    // Act as user and simulate logging into Estate A (Admin)
    Auth::login($this->user);
    $contextManager->activate($this->assignmentA);

    // Initial check: Should be admin
    expect($this->user->contextHasRole('admin'))->toBeTrue()
        ->and($this->user->contextHasRole('resident'))->toBeFalse();

    // Switch context to Estate B (Resident)
    $contextManager->activate($this->assignmentB);

    // If cache leakage exists, this will still return true for admin
    expect($this->user->contextHasRole('admin'))->toBeFalse()
        ->and($this->user->contextHasRole('resident'))->toBeTrue();
})->group('adversarial');

it('enforces route guard lockouts for incorrect contexts', function () {
    $contextManager = app(ContextManager::class);

    // Act as user and activate Estate B (Resident)
    Auth::login($this->user);
    $contextManager->activate($this->assignmentB);

    // We shouldn't be able to access the admin dashboard
    $response = $this->get(route('admin.dashboard'));
    $response->assertRedirect(route('resident.home'));
})->group('adversarial');

it('enforces global scopes for zone isolation', function () {
    // TODO: Need to finish this test after applying ZoneScopedTrait
    // Create users in Zone A and Zone B
    $zoneB = Zone::factory()->create(['estate_id' => $this->estateA->id, 'name' => 'Zone B']);

    $residentZoneA = User::factory()->create();
    EstateMembership::create([
        'user_id' => $residentZoneA->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
    ]);
    AdministrativeAssignment::create([
        'user_id' => $residentZoneA->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'role_id' => $this->residentRole->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);
    setPermissionsTeamId($this->estateA->id);
    $residentZoneA->assignRole($this->residentRole);

    $residentZoneB = User::factory()->create();
    EstateMembership::create([
        'user_id' => $residentZoneB->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
    ]);
    AdministrativeAssignment::create([
        'user_id' => $residentZoneB->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneB->id,
        'role_id' => $this->residentRole->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);
    setPermissionsTeamId($this->estateA->id);
    $residentZoneB->assignRole($this->residentRole);

    // Assign security to Zone A
    $securityUser = User::factory()->create();
    EstateMembership::create([
        'user_id' => $securityUser->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
    ]);
    $securityAssignment = AdministrativeAssignment::create([
        'user_id' => $securityUser->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'role_id' => $this->securityRole->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);
    setPermissionsTeamId($this->estateA->id);
    $securityUser->assignRole($this->securityRole);

    // Login as Zone A Security
    Auth::login($securityUser);
    app(ContextManager::class)->activate($securityAssignment);

    // Try to view all users in the estate
    // We expect the global scope to filter out Zone B
    $propA = Property::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $this->zoneA->id,
        'property_owner_id' => 1,
        'name' => 'Prop A',
    ]);

    $propB = Property::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneB->id,
        'property_owner_id' => 1,
        'name' => 'Prop B',
    ]);

    // As Security for Zone A, we should only see Prop A
    $properties = Property::all();
    expect($properties)->toHaveCount(1)
        ->and($properties->first()->id)->toBe($propA->id);
    expect(true)->toBeTrue();
})->group('adversarial');

it('prevents subscription param spoofing', function () {
    // Ensure subscription middleware uses ContextManager, not the {estate_id} URL param
    Auth::login($this->user);

    // User is active in Estate B
    app(ContextManager::class)->activate($this->assignmentB);

    // Try to retrieve estate context using EstateContextService
    // Since the active context is Estate B, EstateContextService should return Estate B
    $estateContextService = app(EstateContextService::class);
    $estateId = $estateContextService->getEstateId();

    expect($estateId)->toBe($this->estateB->id);
})->group('adversarial');
