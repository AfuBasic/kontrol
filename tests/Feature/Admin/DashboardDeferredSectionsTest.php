<?php

use App\Enums\AssignmentScope;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\SecurityEvent;
use App\Models\User;
use App\Services\Admin\DashboardService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();
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
});

it('loads detailed dashboard stats when pending residents exist', function () {
    $pending = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $pending->assignRole('resident');
    $this->estate->users()->attach($pending->id, ['status' => 'pending']);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id]);

    $stats = app(DashboardService::class)->getDetailedDashboardStats();

    expect($stats)
        ->toHaveKeys(['estateHealth', 'operationalSnapshot', 'financialOverview', 'securityOperations', 'needsAttention'])
        ->and($stats['estateHealth']['name'])->toBe($this->estate->name)
        ->and($stats['needsAttention'])->not->toBeEmpty();
});

it('includes suspicious activity in the action center when events require attention', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    SecurityEvent::factory()->create([
        'user_id' => $resident->id,
        'status' => SecurityEventStatus::Pending,
        'severity' => SecurityEventSeverity::High,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id]);

    $stats = app(DashboardService::class)->getDetailedDashboardStats();
    $item = collect($stats['needsAttention'])->firstWhere('id', 'suspicious_activity');

    expect($item)->not->toBeNull()
        ->and($item['count'])->toBe(1)
        ->and($item['severity'])->toBe('critical');
});

it('counts both residents and property owners in dashboard community metrics', function () {
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);

    $resident = User::factory()->create(['email_verified_at' => now(), 'suspended_at' => null]);
    $propertyOwner = User::factory()->create(['email_verified_at' => now(), 'suspended_at' => null]);

    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $propertyOwner->assignRole('property_owner');

    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);
    $this->estate->users()->attach($propertyOwner->id, ['status' => 'accepted']);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id]);

    $overview = app(DashboardService::class)->getOverviewStats();
    $detailed = app(DashboardService::class)->getDetailedDashboardStats();

    expect($overview['residents']['total'])->toBe(2)
        ->and($overview['residents']['active'])->toBe(2)
        ->and($detailed['operationalSnapshot']['residentsTotal'])->toBe(2)
        ->and($detailed['operationalSnapshot']['residentsActive'])->toBe(2);
});
