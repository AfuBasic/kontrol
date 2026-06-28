<?php

use App\Models\Coupon;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\Billing\BillingFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'resident']);
});

test('zeus admin can create and delete coupons', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();

    $this->withSession([config('zeus.session_key') => true]);

    // Create global percentage coupon
    $response = $this->post(route('zeus.coupons.store'), [
        'campaign_name' => 'Test Coupon 50',
        'code' => 'TEST50',
        'type' => 'percentage',
        'value' => 50,
        'scope' => 'global',
    ]);

    $response->assertRedirect(route('zeus.coupons.index'));
    $this->assertDatabaseHas('coupons', [
        'code' => 'TEST50',
        'type' => 'percentage',
        'value' => 50,
        'estate_id' => null,
        'user_id' => null,
    ]);

    // Create estate fixed coupon
    $this->post(route('zeus.coupons.store'), [
        'campaign_name' => 'Estate Coupon 200',
        'code' => 'ESTATE200',
        'type' => 'fixed',
        'value' => 200, // 200 Naira
        'scope' => 'estate',
        'estate_id' => $estate->id,
    ]);

    $this->assertDatabaseHas('coupons', [
        'code' => 'ESTATE200',
        'type' => 'fixed',
        'value' => 20000, // stored in kobo: 200 * 100
        'estate_id' => $estate->id,
        'user_id' => null,
    ]);

    // Create resident coupon
    $this->post(route('zeus.coupons.store'), [
        'campaign_name' => 'Resident Coupon 30',
        'code' => 'RESIDENT30',
        'type' => 'percentage',
        'value' => 30,
        'scope' => 'resident',
        'user_id' => $resident->id,
    ]);

    $this->assertDatabaseHas('coupons', [
        'code' => 'RESIDENT30',
        'type' => 'percentage',
        'value' => 30,
        'estate_id' => null,
        'user_id' => $resident->id,
    ]);

    // Delete a coupon
    $coupon = Coupon::where('code', 'TEST50')->first();
    $response = $this->delete(route('zeus.coupons.destroy', $coupon));

    $response->assertRedirect(route('zeus.coupons.index'));
    $this->assertDatabaseMissing('coupons', ['code' => 'TEST50']);
});

test('residents can validate a valid coupon code', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $plan = Plan::factory()->create(['price' => 15000]); // ₦150.00 / 15000 kobo

    // Create a 10% coupon
    $coupon = Coupon::create([
        'code' => 'SAVE10',
        'type' => 'percentage',
        'value' => 10,
        'scope' => 'global',
    ]);

    $response = $this->actingAs($resident)
        ->post(route('resident.billing.coupon.validate'), [
            'code' => 'SAVE10',
            'plan_id' => $plan->id,
        ]);

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'code' => 'SAVE10',
            'discount' => 1500, // 10% of 15000
            'final_amount' => 13500,
        ]);
});

test('residents validation fails for expired or mismatched coupons', function () {
    $estate = Estate::factory()->create();
    $otherEstate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $plan = Plan::factory()->create(['price' => 15000]);

    // 1. Expired Coupon
    Coupon::create([
        'code' => 'EXPIRED',
        'type' => 'percentage',
        'value' => 10,
        'expires_at' => now()->subDay(),
    ]);

    $response = $this->actingAs($resident)
        ->post(route('resident.billing.coupon.validate'), [
            'code' => 'EXPIRED',
            'plan_id' => $plan->id,
        ]);

    $response->assertStatus(422)
        ->assertJson(['status' => 'error', 'message' => 'This coupon has expired.']);

    // 2. Mismatched Estate
    Coupon::create([
        'code' => 'OTHERESTATE',
        'type' => 'percentage',
        'value' => 10,
        'estate_id' => $otherEstate->id,
    ]);

    $response = $this->actingAs($resident)
        ->post(route('resident.billing.coupon.validate'), [
            'code' => 'OTHERESTATE',
            'plan_id' => $plan->id,
        ]);

    $response->assertStatus(422)
        ->assertJson(['status' => 'error', 'message' => 'This coupon is not valid for this estate.']);
});

test('subscribing with a valid coupon generates a discounted invoice and logs usage on finalization', function () {
    $estate = Estate::factory()->create();
    $estate->settings()->update([
        'charge_type' => 'residents',
    ]);

    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $plan = Plan::factory()->create(['price' => 15000]); // ₦150.00 / 15000 kobo

    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'past_due',
    ]);

    Coupon::create([
        'code' => 'DISCOUNT50',
        'type' => 'percentage',
        'value' => 50,
    ]);

    Http::fake([
        'api.paystack.co/transaction/initialize' => Http::response([
            'status' => true,
            'message' => 'Authorization URL created',
            'data' => [
                'authorization_url' => 'https://checkout.paystack.com/test-auth-url',
                'access_code' => 'test-access-code',
                'reference' => 'test-ref-coupon',
            ],
        ], 200),
    ]);

    $response = $this->actingAs($resident)
        ->post(route('resident.billing.subscribe'), [
            'plan_id' => $plan->id,
            'coupon_code' => 'DISCOUNT50',
        ]);

    $response->assertRedirectContains('paystack.com');

    // Verify invoice created with 50% discount
    $invoice = Invoice::where('user_id', $resident->id)->firstOrFail();
    expect($invoice->amount)->toBe(7500); // 15000 - 50%
    expect($invoice->metadata['coupon_code'])->toBe('DISCOUNT50');
    expect($invoice->metadata['discount_amount'])->toBe(7500);

    // Finalize payment successfully
    $finalizer = app(BillingFinalizationService::class);
    $finalizer->finalizeSuccess($invoice, [
        'reference' => 'test-ref-coupon',
        'payment_method' => 'card',
        'customer_email' => $resident->email,
    ]);

    // Verify coupon log/audit and usage increment
    $this->assertDatabaseHas('coupon_logs', [
        'user_id' => $resident->id,
        'invoice_id' => $invoice->id,
        'discount_amount' => 7500,
    ]);

    $coupon = Coupon::where('code', 'DISCOUNT50')->firstOrFail();
    expect($coupon->used_count)->toBe(1);
});
