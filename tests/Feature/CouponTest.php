<?php

use App\Models\Coupon;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Notifications\Resident\CouponIssuedNotification;
use App\Services\Billing\BillingFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
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

test('residents validation fails for expired, scheduled, or mismatched coupons', function () {
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
        'status' => 'active',
        'expires_at' => now()->subDay(),
    ]);

    $response = $this->actingAs($resident)
        ->post(route('resident.billing.coupon.validate'), [
            'code' => 'EXPIRED',
            'plan_id' => $plan->id,
        ]);

    $response->assertStatus(422)
        ->assertJson(['status' => 'error', 'message' => 'This coupon has expired.']);

    // 2. Scheduled Coupon (not yet started)
    Coupon::create([
        'code' => 'SCHEDULED',
        'type' => 'percentage',
        'value' => 10,
        'status' => 'active',
        'starts_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($resident)
        ->post(route('resident.billing.coupon.validate'), [
            'code' => 'SCHEDULED',
            'plan_id' => $plan->id,
        ]);

    $response->assertStatus(422)
        ->assertJson(['status' => 'error', 'message' => 'This coupon is not yet valid.']);

    // 3. Mismatched Estate
    Coupon::create([
        'code' => 'OTHERESTATE',
        'type' => 'percentage',
        'value' => 10,
        'status' => 'active',
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

    $transaction = PaymentTransaction::where('paystack_reference', 'test-ref-coupon')->firstOrFail();
    expect($transaction->metadata['coupon_code'])->toBe('DISCOUNT50');

    $coupon = Coupon::where('code', 'DISCOUNT50')->firstOrFail();
    expect($coupon->used_count)->toBe(1);
});

test('resident billing index page has autoAppliedCoupon and shares has_active_coupons', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'past_due',
    ]);

    // Create estate coupon
    Coupon::create([
        'campaign_name' => 'Auto Coupon 30',
        'code' => 'AUTO30',
        'type' => 'percentage',
        'value' => 30,
        'scope' => 'estate',
        'status' => 'active',
        'estate_id' => $estate->id,
    ]);

    // 1. Visit index page
    $response = $this->actingAs($resident)
        ->get(route('resident.billing.index'));

    $response->assertOk();

    // Check that autoAppliedCoupon is present
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/Billing/Index')
        ->has('autoAppliedCoupon')
        ->where('autoAppliedCoupon.code', 'AUTO30')
    );

    // 2. Verify shared Inertia property 'auth.user.has_active_coupons' is true
    $response->assertInertia(fn ($page) => $page
        ->where('auth.user.has_active_coupons', true)
    );
});

test('resident can access coupons index page and see their active coupons', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    // Create estate coupon
    Coupon::create([
        'campaign_name' => 'Resident Promo 20',
        'code' => 'PROMO20',
        'type' => 'percentage',
        'value' => 20,
        'scope' => 'estate',
        'status' => 'active',
        'estate_id' => $estate->id,
        'usage_limit' => 2,
    ]);

    $response = $this->actingAs($resident)
        ->get(route('resident.coupons.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/Coupons/Index')
        ->has('coupons')
        ->where('coupons.0.code', 'PROMO20')
        ->where('coupons.0.personal_limit', 2)
        ->where('coupons.0.personal_uses', 0)
    );
});

test('resident coupons menu and list only include coupons within their validity period', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'past_due',
    ]);

    Coupon::create([
        'campaign_name' => 'Live Now',
        'code' => 'LIVE20',
        'type' => 'percentage',
        'value' => 20,
        'status' => 'active',
        'estate_id' => $estate->id,
        'starts_at' => now()->subDay(),
        'expires_at' => now()->addDays(7),
    ]);

    Coupon::create([
        'campaign_name' => 'Starts Tomorrow',
        'code' => 'FUTURE30',
        'type' => 'percentage',
        'value' => 30,
        'status' => 'active',
        'estate_id' => $estate->id,
        'starts_at' => now()->addDay(),
        'expires_at' => now()->addDays(14),
    ]);

    Coupon::create([
        'campaign_name' => 'Already Ended',
        'code' => 'ENDED10',
        'type' => 'percentage',
        'value' => 10,
        'status' => 'active',
        'estate_id' => $estate->id,
        'starts_at' => now()->subDays(14),
        'expires_at' => now()->subDay(),
    ]);

    // Coupons index should only list the in-window coupon
    $this->actingAs($resident)
        ->get(route('resident.coupons.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/Coupons/Index')
            ->has('coupons', 1)
            ->where('coupons.0.code', 'LIVE20')
        );

    // Menu flag + auto-apply should only reflect in-window coupons
    $this->actingAs($resident)
        ->get(route('resident.billing.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.has_active_coupons', true)
            ->where('autoAppliedCoupon.code', 'LIVE20')
        );
});

test('resident coupons menu is hidden when only scheduled or expired coupons exist', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'past_due',
    ]);

    Coupon::create([
        'campaign_name' => 'Starts Tomorrow',
        'code' => 'FUTUREONLY',
        'type' => 'percentage',
        'value' => 30,
        'status' => 'active',
        'estate_id' => $estate->id,
        'starts_at' => now()->addDay(),
    ]);

    Coupon::create([
        'campaign_name' => 'Already Ended',
        'code' => 'EXPIREDONLY',
        'type' => 'percentage',
        'value' => 10,
        'status' => 'active',
        'estate_id' => $estate->id,
        'expires_at' => now()->subDay(),
    ]);

    $this->actingAs($resident)
        ->get(route('resident.billing.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.has_active_coupons', false)
            ->where('autoAppliedCoupon', null)
        );

    $this->actingAs($resident)
        ->get(route('resident.coupons.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/Coupons/Index')
            ->has('coupons', 0)
        );
});

test('resident coupon validation returns 422 error for a deleted or non-existent coupon', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    $plan = Plan::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($resident)
        ->postJson(route('resident.billing.coupon.validate'), [
            'code' => 'DELETED_CODE',
            'plan_id' => $plan->id,
        ]);

    $response->assertStatus(422);
    $response->assertJson([
        'status' => 'error',
        'message' => 'Invalid coupon code.',
    ]);
});

test('zeus admin can create coupons for multiple residents', function () {
    $estate = Estate::factory()->create();
    $resident1 = User::factory()->create();
    $resident2 = User::factory()->create();

    $response = $this->withSession([config('zeus.session_key') => true])
        ->post(route('zeus.coupons.store'), [
            'campaign_name' => 'Multi Resident Promo',
            'code' => 'MULTI50',
            'type' => 'percentage',
            'value' => 50,
            'scope' => 'resident',
            'user_ids' => [$resident1->id, $resident2->id],
        ]);

    $response->assertRedirect(route('zeus.coupons.index'));

    $this->assertDatabaseHas('coupons', [
        'code' => 'MULTI50-'.$resident1->id,
        'user_id' => $resident1->id,
        'value' => 50,
    ]);

    $this->assertDatabaseHas('coupons', [
        'code' => 'MULTI50-'.$resident2->id,
        'user_id' => $resident2->id,
        'value' => 50,
    ]);
});

test('coupon validation fails if the coupon is not eligible for the plan', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    $plan1 = Plan::factory()->create(['price' => 5000]);
    $plan2 = Plan::factory()->create(['price' => 10000]);

    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    // Create a coupon restricted to plan1
    $coupon = Coupon::create([
        'campaign_name' => 'Plan 1 Only',
        'code' => 'PLAN1ONLY',
        'type' => 'percentage',
        'value' => 20,
        'scope' => 'global',
        'eligible_plans' => [$plan1->id],
        'status' => 'active',
        'creator_id' => $resident->id,
    ]);

    // Validation should succeed for plan1
    $response1 = $this->actingAs($resident)
        ->postJson(route('resident.billing.coupon.validate'), [
            'code' => 'PLAN1ONLY',
            'plan_id' => $plan1->id,
        ]);
    $response1->assertOk();
    $response1->assertJson(['status' => 'success']);

    // Validation should fail for plan2
    $response2 = $this->actingAs($resident)
        ->postJson(route('resident.billing.coupon.validate'), [
            'code' => 'PLAN1ONLY',
            'plan_id' => $plan2->id,
        ]);
    $response2->assertStatus(422);
    $response2->assertJson([
        'status' => 'error',
        'message' => 'This coupon is not valid for the selected plan.',
    ]);
});

test('notifies residents when a coupon is created for them', function () {
    Notification::fake();

    $resident1 = User::factory()->create();
    $resident2 = User::factory()->create();

    $response = $this->withSession([config('zeus.session_key') => true])
        ->post(route('zeus.coupons.store'), [
            'campaign_name' => 'Single Resident Promo',
            'code' => 'SINGLE50',
            'type' => 'percentage',
            'value' => 50,
            'scope' => 'resident',
            'user_ids' => [$resident1->id],
        ]);

    $response->assertRedirect(route('zeus.coupons.index'));

    Notification::assertSentTo(
        $resident1,
        CouponIssuedNotification::class
    );

    Notification::assertNotSentTo(
        $resident2,
        CouponIssuedNotification::class
    );
});

test('notifies all estate residents when an estate level coupon is created', function () {
    Notification::fake();

    $estate = Estate::factory()->create();
    $resident1 = User::factory()->create();
    $resident2 = User::factory()->create();
    $nonResident = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $resident1->assignRole('resident');
    $resident1->estates()->attach($estate->id, ['status' => 'accepted']);
    $resident2->assignRole('resident');
    $resident2->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->withSession([config('zeus.session_key') => true])
        ->post(route('zeus.coupons.store'), [
            'campaign_name' => 'Estate Wide Promo',
            'code' => 'ESTATE50',
            'type' => 'percentage',
            'value' => 50,
            'scope' => 'estate',
            'estate_id' => $estate->id,
        ]);

    $response->assertRedirect(route('zeus.coupons.index'));

    Notification::assertSentTo(
        $resident1,
        CouponIssuedNotification::class
    );

    Notification::assertSentTo(
        $resident2,
        CouponIssuedNotification::class
    );

    Notification::assertNotSentTo(
        $nonResident,
        CouponIssuedNotification::class
    );
});
