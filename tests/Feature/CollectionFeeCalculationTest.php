<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\ResidentSubscription;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('calculates fees exactly and charges 0.5% processing fee when resident has no active subscription', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    $admin->assignRole('admin', $estate->id);
    
    EstateSettings::factory()->create([
        'estate_id' => $estate->id,
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident', $estate->id);

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
    
    $response->assertStatus(200);
    
    // Base Amount: 1000
    // Kontrol Fee (0.5%): 5
    // Target: 1005
    // Paystack Fee (<2500): 1005 / 0.985 = 1020.3045...
    // Ceil: 1020.31
    // Paystack Fee: 1020.31 - 1005 = 15.31
    // Kontrol Fee: 5.0
    // Transaction Charge (Kontrol + Paystack) in Kobo: (5.0 + 15.31) * 100 = 2031
    
    $response->assertJson([
        'already_paid' => false,
        'base_amount' => 1000,
        'kontrol_fee' => 5.0,
        'paystack_fee' => 15.31,
        'amount' => 1020.31,
        'subaccount' => 'ACCT_ESTATE_123',
        'bearer' => 'account',
        'transaction_charge' => 2031,
    ]);
});

it('waives the 0.5% processing fee when resident has an active subscription', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    $admin->assignRole('admin', $estate->id);
    
    EstateSettings::factory()->create([
        'estate_id' => $estate->id,
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident', $estate->id);

    // Create active subscription
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
    
    $response->assertStatus(200);
    
    // Base Amount: 1000
    // Kontrol Fee (0.5%): 0 (waived)
    // Target: 1000
    // Paystack Fee (<2500): 1000 / 0.985 = 1015.228...
    // Ceil: 1015.23
    // Paystack Fee: 1015.23 - 1000 = 15.23
    // Kontrol Fee: 0
    // Transaction Charge (Kontrol + Paystack) in Kobo: (0 + 15.23) * 100 = 1523
    
    $response->assertJson([
        'already_paid' => false,
        'base_amount' => 1000,
        'kontrol_fee' => 0,
        'paystack_fee' => 15.23,
        'amount' => 1015.23,
        'subaccount' => 'ACCT_ESTATE_123',
        'bearer' => 'account',
        'transaction_charge' => 1523,
    ]);
});

it('resolves the correct subaccount for property owner collections', function () {
    $estate = Estate::factory()->create();
    
    // Estate has one subaccount
    EstateSettings::factory()->create([
        'estate_id' => $estate->id,
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $propertyOwner = User::factory()->create();
    $propertyOwner->assignRole('property_owner', $estate->id);
    
    // Property Owner has a different subaccount
    \App\Models\UserProfile::factory()->create([
        'user_id' => $propertyOwner->id,
        'paystack_subaccount_code' => 'ACCT_LANDLORD_999',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident', $estate->id);

    // Collection created by property owner
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
    
    $response->assertStatus(200);
    
    // Base Amount: 5000
    // Kontrol Fee (0.5%): 25
    // Target: 5025
    // Paystack Fee (>=2500): (5025 + 100) / 0.985 = 5203.045...
    // Ceil: 5203.05
    // Paystack Fee: 5203.05 - 5025 = 178.05
    // Kontrol Fee: 25.0
    // Transaction Charge (Kontrol + Paystack) in Kobo: (25.0 + 178.05) * 100 = 20305
    
    $response->assertJson([
        'already_paid' => false,
        'base_amount' => 5000,
        'kontrol_fee' => 25.0,
        'paystack_fee' => 178.05,
        'amount' => 5203.05,
        'subaccount' => 'ACCT_LANDLORD_999',
        'bearer' => 'account',
        'transaction_charge' => 20305,
    ]);
});

