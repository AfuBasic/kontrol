<?php

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Enums\AssignmentScope;
use App\Models\AccessCode;
use App\Models\AdministrativeAssignment;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\HouseholdMember;
use App\Models\ResidentSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('resident dashboard returns unpaid collections correctly', function () {
    // 1. Setup roles
    Role::create(['name' => 'resident']);

    // 2. Setup database records
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');

    // Add estate relationship via pivot
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    // Create a Collection and CollectionAssignment manually
    $collection = Collection::create([
        'estate_id' => $estate->id,
        'name' => 'Security Levy',
        'amount' => 10000,
        'billing_type' => 'one-time',
        'applies_to' => 'all',
        'status' => 'active',
        'created_by' => $user->id,
        'start_date' => now(),
        'due_day' => 1,
        'grace_days' => 0,
    ]);

    $assignment = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'amount_due' => 10000,
        'amount_paid' => 0,
        'status' => 'pending',
        'due_date' => now()->addDays(7),
    ]);

    // 3. Act
    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.home'));

    // 4. Assert eager shell; unpaid dues are deferred
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/Home')
        ->has('stats')
        ->has('estateName')
        ->missing('unpaidDues')
        ->where('activePassesCount', 0)
        ->where('openIncidentsCount', 0)
    );

    // Sanity: assignment exists for deferred payload once loaded client-side
    expect(CollectionAssignment::where('user_id', $user->id)->where('status', 'pending')->count())->toBe(1);
    expect($assignment->collection->name)->toBe('Security Levy');
    expect($assignment->amount_due)->toBe(10000);
});

test('resident dashboard returns active and upcoming passes correctly', function () {
    $this->travelTo(now()->startOfDay()->addHours(9));

    Role::firstOrCreate(['name' => 'resident']);

    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    // Create an active (current) access code
    AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => '123456',
        'type' => 'visitor',
        'visitor_name' => 'John Doe',
        'starts_at' => now()->subHour(),
        'expires_at' => now()->addHour(),
        'status' => AccessCodeStatus::Active,
        'source' => AccessCodeSource::Web,
    ]);

    // Create an upcoming (future) access code
    AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => '654321',
        'type' => 'visitor',
        'visitor_name' => 'Jane Smith',
        'starts_at' => now()->addHours(2),
        'expires_at' => now()->addHours(4),
        'status' => AccessCodeStatus::Scheduled,
        'source' => AccessCodeSource::Web,
    ]);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/Home')
        ->where('activePassesCount', 1)
        ->where('upcomingPassesCount', 1)
    );
});

test('billing payer contexts receive subscription badge data', function (string $roleName) {
    $payerRole = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

    $estate = Estate::factory()->create();
    $payer = User::factory()->create();

    $payer->estates()->attach($estate->id, ['status' => 'accepted']);

    setPermissionsTeamId($estate->id);
    $payer->assignRole($payerRole);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $payer->id,
        'estate_id' => $estate->id,
        'role_id' => $payerRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    ResidentSubscription::create([
        'user_id' => $payer->id,
        'estate_id' => $estate->id,
        'status' => 'past_due',
    ]);

    $this->actingAs($payer)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/Home')
            ->where('auth.user.resident_subscription.status', 'past_due')
            ->where('auth.user.resident_subscription.can_manage_billing', true)
        );
})->with(['resident', 'property_owner']);

test('household members do not receive subscription badge data', function () {
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $householdRole = Role::firstOrCreate(['name' => 'household_member', 'guard_name' => 'web']);

    $estate = Estate::factory()->create();
    $primaryResident = User::factory()->create(['name' => 'Primary Resident']);
    $householdMember = User::factory()->create();

    $primaryResident->estates()->attach($estate->id, ['status' => 'accepted']);
    $householdMember->estates()->attach($estate->id, [
        'status' => 'accepted',
        'relationship_type' => 'household_member',
    ]);

    setPermissionsTeamId($estate->id);
    $primaryResident->assignRole($residentRole);
    $householdMember->assignRole($householdRole);

    HouseholdMember::create([
        'estate_id' => $estate->id,
        'primary_resident_id' => $primaryResident->id,
        'household_member_id' => $householdMember->id,
    ]);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $householdMember->id,
        'estate_id' => $estate->id,
        'role_id' => $householdRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    ResidentSubscription::create([
        'user_id' => $primaryResident->id,
        'estate_id' => $estate->id,
        'status' => 'past_due',
    ]);

    $this->actingAs($householdMember)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/Home')
            ->where('auth.user.resident_subscription', null)
            ->where('auth.user.household_parent_name', 'Primary Resident')
        );
});
