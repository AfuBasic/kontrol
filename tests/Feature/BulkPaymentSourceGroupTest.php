<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // 1. Setup Roles
    $this->residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $this->ownerRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    $this->adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    // 2. Setup Estate
    $this->estate = Estate::factory()->create();

    // 3. Configure Estate Settlement Account
    $settings = EstateSettings::forEstate($this->estate->id);
    $settings->update(['paystack_subaccount_code' => 'ACCT_estate_test']);

    // Set permission team context
    setPermissionsTeamId($this->estate->id);

    // 4. Create Users
    $this->adminUser = User::factory()->create();
    $this->adminUser->assignRole($this->adminRole);
    $this->estate->users()->attach($this->adminUser->id, ['status' => 'accepted']);

    $this->owner = User::factory()->create();
    $this->owner->assignRole([$this->residentRole, $this->ownerRole]);
    $this->owner->profile()->updateOrCreate([], [
        'paystack_subaccount_code' => 'ACCT_landlord_test',
    ]);
    $this->estate->users()->attach($this->owner->id, ['status' => 'accepted']);

    $this->resident = User::factory()->create();
    $this->resident->assignRole($this->residentRole);
    $this->resident->profile()->updateOrCreate([], [
        'property_owner_id' => $this->owner->id,
    ]);
    $this->estate->users()->attach($this->resident->id, ['status' => 'accepted']);
});

test('resident cannot initiate bulk payment for mixed estate and landlord bills', function () {
    // 1. Create Estate Collection & Assignment
    $estateCollection = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Estate Security Levy',
        'amount' => 5000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->adminUser->id,
    ]);
    $estateAssignment = CollectionAssignment::create([
        'collection_id' => $estateCollection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 5000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    // 2. Create Property Owner Collection & Assignment
    $ownerCollection = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Monthly Rent',
        'amount' => 100000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->owner->id,
    ]);
    $ownerAssignment = CollectionAssignment::create([
        'collection_id' => $ownerCollection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 100000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    // 3. Act & Assert: Mixed collections list passed to showBulk
    $this->actingAs($this->resident);

    $response = $this->get(route('web.billing.collections.show_bulk', [
        'assignments' => "{$estateAssignment->ulid},{$ownerAssignment->ulid}",
    ]));

    // Expecting 400 Bad Request due to mixed settlement accounts
    $response->assertStatus(400);

    // Act & Assert: Mixed collections list passed to initiateBulk
    $responsePost = $this->postJson(route('web.billing.collections.initiate_bulk', [
        'assignments' => "{$estateAssignment->ulid},{$ownerAssignment->ulid}",
    ]));

    $responsePost->assertStatus(400);
});

test('resident can view bulk payment screen for only estate bills', function () {
    // Create two Estate Collections
    $c1 = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Estate Levy 1',
        'amount' => 3000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->adminUser->id,
    ]);
    $a1 = CollectionAssignment::create([
        'collection_id' => $c1->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 3000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    $c2 = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Estate Levy 2',
        'amount' => 4000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->adminUser->id,
    ]);
    $a2 = CollectionAssignment::create([
        'collection_id' => $c2->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 4000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    $this->actingAs($this->resident);

    $response = $this->get(route('web.billing.collections.show_bulk', [
        'assignments' => "{$a1->ulid},{$a2->ulid}",
    ]));

    $response->assertOk();

    $responsePost = $this->postJson(route('web.billing.collections.initiate_bulk', [
        'assignments' => "{$a1->ulid},{$a2->ulid}",
    ]));

    $responsePost->assertOk();
    $responsePost->assertJsonFragment([
        'already_paid' => false,
        'subaccount' => 'ACCT_estate_test',
    ]);
});

test('resident can view bulk payment screen for only landlord bills', function () {
    // Create two landlord collections
    $c1 = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Rent 1',
        'amount' => 12000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->owner->id,
    ]);
    $a1 = CollectionAssignment::create([
        'collection_id' => $c1->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 12000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    $c2 = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Rent 2',
        'amount' => 13000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->owner->id,
    ]);
    $a2 = CollectionAssignment::create([
        'collection_id' => $c2->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 13000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    $this->actingAs($this->resident);

    $response = $this->get(route('web.billing.collections.show_bulk', [
        'assignments' => "{$a1->ulid},{$a2->ulid}",
    ]));

    $response->assertOk();

    $responsePost = $this->postJson(route('web.billing.collections.initiate_bulk', [
        'assignments' => "{$a1->ulid},{$a2->ulid}",
    ]));

    $responsePost->assertOk();
    $responsePost->assertJsonFragment([
        'already_paid' => false,
        'subaccount' => 'ACCT_landlord_test',
    ]);
});

test('bulk payment verification creates child payment records with unique references and marks assignments as paid', function () {
    $c1 = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Rent 1',
        'amount' => 12000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->owner->id,
    ]);
    $a1 = CollectionAssignment::create([
        'collection_id' => $c1->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 12000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    $c2 = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Rent 2',
        'amount' => 13000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $this->owner->id,
    ]);
    $a2 = CollectionAssignment::create([
        'collection_id' => $c2->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'amount_due' => 13000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    $this->actingAs($this->resident);

    // 1. Initiate bulk payment
    $responsePost = $this->postJson(route('web.billing.collections.initiate_bulk', [
        'assignments' => "{$a1->ulid},{$a2->ulid}",
    ]));
    $responsePost->assertOk();
    $ref = $responsePost->json('reference');

    // 2. Call verify endpoint
    $verifyResponse = $this->postJson(route('web.billing.collection.verify', ['reference' => $ref]));
    $verifyResponse->assertOk();

    // 3. Assert parent payment updated to success
    $this->assertDatabaseHas('payments', [
        'reference' => $ref,
        'status' => 'success',
        'collection_assignment_id' => null,
    ]);

    // 4. Assert child payments created with unique references
    $this->assertDatabaseHas('payments', [
        'reference' => "{$ref}-{$a1->id}",
        'status' => 'success',
        'collection_assignment_id' => $a1->id,
        'amount' => 12000,
    ]);

    $this->assertDatabaseHas('payments', [
        'reference' => "{$ref}-{$a2->id}",
        'status' => 'success',
        'collection_assignment_id' => $a2->id,
        'amount' => 13000,
    ]);

    // 5. Assert assignments are marked paid
    expect($a1->fresh()->isPaid())->toBeTrue();
    expect($a2->fresh()->isPaid())->toBeTrue();
});
