<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Services\Compliance\ComplianceEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('raises violation, evaluates policy stages, and protects visitor passes', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
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
