<?php

use App\Jobs\Admin\RecurringAssignmentJob;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('processes recurring collection when next_processing_date is today or past', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    // Simulate user membership in estate
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $now = Carbon::parse('2024-03-01 00:05:00');
    Carbon::setTestNow($now);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'billing_type' => 'recurring',
        'recurring_interval' => 'monthly',
        'status' => 'active',
        'start_date' => '2024-03-01',
        'next_processing_date' => '2024-03-01',
        'due_day' => 5,
        'applies_to' => 'target',
    ]);

    // Add target manually for test since applies_to all with no targets sometimes relies on property_owner logic
    $collection->targets()->create([
        'target_type' => User::class,
        'target_id' => $user->id,
    ]);

    RecurringAssignmentJob::dispatch();

    $assignments = CollectionAssignment::withoutGlobalScopes()->where('collection_id', $collection->id)->get();
    expect($assignments)->toHaveCount(1);

    $assignment = $assignments->first();
    expect($assignment->user_id)->toBe($user->id)
        ->and($assignment->period)->toBe('2024-03')
        ->and($assignment->due_date->toDateString())->toBe('2024-03-05');

    // next_processing_date should be updated to next month
    $collection->refresh();
    expect($collection->next_processing_date->toDateString())->toBe('2024-04-01');
});

it('does not process recurring collection when next_processing_date is in the future', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $now = Carbon::parse('2024-03-01 00:05:00');
    Carbon::setTestNow($now);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'billing_type' => 'recurring',
        'recurring_interval' => 'monthly',
        'status' => 'active',
        'start_date' => '2024-02-01',
        'next_processing_date' => '2024-03-15', // Future
        'due_day' => 5,
        'applies_to' => 'target',
    ]);

    $collection->targets()->create([
        'target_type' => User::class,
        'target_id' => $user->id,
    ]);

    RecurringAssignmentJob::dispatch();

    $assignments = CollectionAssignment::withoutGlobalScopes()->where('collection_id', $collection->id)->get();
    expect($assignments)->toHaveCount(0);
});

it('catches up by generating multiple assignments if next_processing_date is far in the past', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    // Job ran 2 months late
    $now = Carbon::parse('2024-05-01 00:05:00');
    Carbon::setTestNow($now);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'billing_type' => 'recurring',
        'recurring_interval' => 'monthly',
        'status' => 'active',
        'start_date' => '2024-03-01',
        'next_processing_date' => '2024-03-01', // Should have processed in March
        'due_day' => 5,
        'applies_to' => 'target',
    ]);

    $collection->targets()->create([
        'target_type' => User::class,
        'target_id' => $user->id,
    ]);

    RecurringAssignmentJob::dispatch();

    $assignments = CollectionAssignment::withoutGlobalScopes()->where('collection_id', $collection->id)->orderBy('period')->get();

    // Should generate for March, April, and May (since May 1st <= May 1st)
    expect($assignments)->toHaveCount(3);

    expect($assignments[0]->period)->toBe('2024-03')
        ->and($assignments[0]->due_date->toDateString())->toBe('2024-03-05');

    expect($assignments[1]->period)->toBe('2024-04')
        ->and($assignments[1]->due_date->toDateString())->toBe('2024-04-05');

    expect($assignments[2]->period)->toBe('2024-05')
        ->and($assignments[2]->due_date->toDateString())->toBe('2024-05-05');

    // next_processing_date should be updated to June
    $collection->refresh();
    expect($collection->next_processing_date->toDateString())->toBe('2024-06-01');
});
