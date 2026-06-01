<?php

use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('a pending invoice is automatically generated when a resident subscription is expiring in 4 days', function () {
    // 1. Setup role and estate
    Role::create(['name' => 'resident']);
    $estate = Estate::factory()->create();

    // Set charge type to 'residents' to require individual billing
    $estate->settings()->update([
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 5,
    ]);

    // Create a plan and assign subscription record to the estate
    $plan = Plan::factory()->create(['price' => 15000]);
    $estateSub = EstateSubscription::create([
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
        'next_billing_date' => now()->addMonth(),
    ]);

    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    // Create a resident subscription expiring in 4 days
    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'trial',
        'trial_ends_at' => now()->addDays(4),
        'current_period_start' => now()->subDay(),
        'current_period_end' => now()->addDays(4),
    ]);

    // Ensure no invoice exists initially
    expect(Invoice::where('user_id', $resident->id)->count())->toBe(0);

    // 2. Act: visit the billing index
    $response = $this->actingAs($resident)
        ->get(route('resident.billing.index'));

    $response->assertOk();

    // 3. Assert: a pending invoice is created for the plan amount
    expect(Invoice::where('user_id', $resident->id)->count())->toBe(1);

    $invoice = Invoice::where('user_id', $resident->id)->first();
    expect($invoice->amount)->toBe(15000);
    expect($invoice->status)->toBe('pending');
});
