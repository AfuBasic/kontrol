<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Services\Compliance\ComplianceEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('raises violation, evaluates policy stages, and protects visitor passes for estate-level collections', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    $user = User::factory()->create();

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
    ]);

    $assignment = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'amount_due' => 5000000,
        'amount_paid' => 0,
        'status' => 'overdue',
        'due_date' => now()->subDays(25),
    ]);

    /** @var ComplianceEngine $engine */
    $engine = app(ComplianceEngine::class);

    $violation = $engine->raiseViolation($assignment);

    expect($violation)->not->toBeNull();
    expect($violation->outstanding_amount)->toEqual('50000.00');

    // Verify visitor passes are NEVER restricted
    $visitorRestricted = $engine->isRestricted($user, 'visitor_pass.create', $estate->id);
    expect($visitorRestricted)->toBeFalse();

    // Resolve violation
    $engine->resolveCompliance($assignment, 'Paid in full');
    $violation->refresh();

    expect($violation->status)->toBe('resolved');
    expect($violation->resolved_at)->not->toBeNull();
});

it('does NOT create compliance violations for property owner level collections', function () {
    $estate = Estate::factory()->create();
    $propertyOwner = User::factory()->create();
    $resident = User::factory()->create();

    // Assign property_owner role to creator
    $role = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    setPermissionsTeamId($estate->id);
    $propertyOwner->assignRole($role);

    $poCollection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $propertyOwner->id,
    ]);

    $poAssignment = CollectionAssignment::create([
        'collection_id' => $poCollection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 3000000,
        'amount_paid' => 0,
        'status' => 'overdue',
        'due_date' => now()->subDays(20),
    ]);

    /** @var ComplianceEngine $engine */
    $engine = app(ComplianceEngine::class);

    $violation = $engine->raiseViolation($poAssignment);

    // Violation MUST be null for Property Owner collections
    expect($violation)->toBeNull();
});
