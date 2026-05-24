<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
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
        ->get(route('resident.home'));

    // 4. Assert
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/Home')
        ->has('unpaidDues', 1)
        ->where('unpaidDues.0.ulid', $assignment->ulid)
        ->where('unpaidDues.0.collection.name', 'Security Levy')
        ->where('unpaidDues.0.amount_due', 10000)
    );
});
