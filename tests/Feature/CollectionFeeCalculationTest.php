<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Models\ResidentSubscription;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    Http::fake([
        'api.paystack.co/*' => Http::response([
            'status' => false,
            'message' => 'Transaction reference not found',
        ], 404),
    ]);
});

it('calculates fees exactly and charges 0.5% processing fee when resident has no active subscription', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'amount' => 1000,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 1000,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $assignment->ulid]));

    $response->assertSuccessful();

    // Base Amount: 1000 NGN
    // Kontrol Fee (0.5%): 5
    // Target: 1005
    // Paystack Fee (<2500): 1005 / 0.985 = 1020.3045...
    // Ceil: 1020.31
    // Paystack Fee: 1020.31 - 1005 = 15.31
    // amount_kobo: 102031

    $response->assertJson([
        'already_paid' => false,
        'base_amount' => 1000,
        'kontrol_fee' => 5.0,
        'paystack_fee' => 15.31,
        'amount' => 1020.31,
        'amount_kobo' => 102031,
        'subaccount' => 'ACCT_ESTATE_123',
        'bearer' => 'account',
        'transaction_charge' => 2031,
    ]);

    expect(Payment::withoutGlobalScope(\App\Models\Scopes\PaymentScope::class)->where('collection_assignment_id', $assignment->id)->value('amount'))->toBe(1000);
});

it('waives the 0.5% processing fee when resident has an active subscription', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    ResidentSubscription::factory()->create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'status' => 'active',
        'current_period_end' => now()->addDays(30),
    ]);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'amount' => 1000,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 1000,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $assignment->ulid]));

    $response->assertSuccessful();

    $response->assertJson([
        'already_paid' => false,
        'base_amount' => 1000,
        'kontrol_fee' => 0,
        'paystack_fee' => 15.23,
        'amount' => 1015.23,
        'amount_kobo' => 101523,
        'subaccount' => 'ACCT_ESTATE_123',
        'bearer' => 'account',
        'transaction_charge' => 1523,
    ]);
});

it('resolves the correct subaccount for property owner collections', function () {
    $estate = Estate::factory()->create();
    setPermissionsTeamId($estate->id);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $propertyOwner = User::factory()->create();
    $propertyOwner->assignRole('property_owner');
    $estate->users()->attach($propertyOwner->id, ['status' => 'accepted']);
    $propertyOwner->profile()->updateOrCreate([], [
        'paystack_subaccount_code' => 'ACCT_LANDLORD_999',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $propertyOwner->id,
        'amount' => 5000,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 5000,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $assignment->ulid]));

    $response->assertSuccessful();

    $response->assertJson([
        'already_paid' => false,
        'base_amount' => 5000,
        'kontrol_fee' => 25.0,
        'paystack_fee' => 178.05,
        'amount' => 5203.05,
        'amount_kobo' => 520305,
        'subaccount' => 'ACCT_LANDLORD_999',
        'bearer' => 'account',
        'transaction_charge' => 20305,
    ]);
});

it('accepts partial payment amounts when remaining balance is at least 20% of the bill', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'amount' => 100000,
    ]);

    // 50% still outstanding → partial allowed
    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 100000,
        'amount_paid' => 50000,
        'status' => 'partial',
    ]);

    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $assignment->ulid]), [
        'amount' => 25000,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('base_amount', 25000)
        ->assertJsonPath('already_paid', false);

    expect($response->json('amount_kobo'))->toBeInt()->toBeGreaterThanOrEqual(100);
    expect(Payment::withoutGlobalScope(\App\Models\Scopes\PaymentScope::class)->where('collection_assignment_id', $assignment->id)->value('amount'))->toBe(25000);
});

it('rejects partial payments when remaining balance is below 20% of the bill', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'amount' => 100000,
    ]);

    // Only 15% remaining → partial blocked
    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 100000,
        'amount_paid' => 85000,
        'status' => 'partial',
    ]);

    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $assignment->ulid]), [
        'amount' => 5000,
    ]);

    $response->assertStatus(400);
    expect($response->json('message'))->toContain('Partial payments must be at least');

    expect(Payment::where('collection_assignment_id', $assignment->id)->count())->toBe(0);
});

it('still allows full payment when remaining balance is below 20% of the bill', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'amount' => 100000,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 100000,
        'amount_paid' => 85000,
        'status' => 'partial',
    ]);

    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $assignment->ulid]), [
        'amount' => 15000,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('base_amount', 15000);

    expect(Payment::withoutGlobalScope(\App\Models\Scopes\PaymentScope::class)->where('collection_assignment_id', $assignment->id)->value('amount'))->toBe(15000);
});

it('normalizes legacy kobo amounts from the client into NGN when partial is allowed', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'amount' => 100000,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 100000,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    // Legacy client sends NGN 15000 as 1_500_000 kobo
    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $assignment->ulid]), [
        'amount' => 1_500_000,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('base_amount', 15000);

    expect(Payment::withoutGlobalScope(\App\Models\Scopes\PaymentScope::class)->where('collection_assignment_id', $assignment->id)->value('amount'))->toBe(15000);
    expect($response->json('amount_kobo'))->toBeInt()->toBeGreaterThanOrEqual(100);
});
