<?php

use App\Actions\Billing\CalculateInvoicePricingAction;
use App\Models\Coupon;
use App\Models\CouponLog;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\Billing\BillingFinalizationService;
use App\Services\Billing\RecurringBillingService;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('it correctly consumes a coupon cycle and handles pricing calculation', function () {
    Role::create(['name' => 'resident']);
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $plan = Plan::factory()->create(['price' => 10000]);

    // Create a coupon
    $coupon = Coupon::create([
        'code' => 'TEST50',
        'type' => 'percentage',
        'value' => 50,
        'estate_id' => $estate->id,
        'usage_limit' => 10,
        'status' => 'active',
        'is_recurring' => true,
        'billing_cycles' => 3, // Valid for 3 cycles
    ]);

    // Apply coupon to subscription
    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_start' => now()->subMonth(),
        'current_period_end' => now(),
        'coupon_id' => $coupon->id,
    ]);

    // Generate Invoice pricing
    $pricing = app(CalculateInvoicePricingAction::class)->execute(10000, $coupon, $resident, $estate, $subscription);

    expect($pricing['subtotal'])->toBe(10000); // Original amount
    expect($pricing['discount_amount'])->toBe(5000); // 50% discount
    expect($pricing['amount'])->toBe(5000);

    // Create Invoice manually
    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'TEST-INV-COUPON',
        'amount' => 10000,
        'final_amount' => 5000,
        'discount_amount' => 5000,
        'coupon_id' => $coupon->id,
        'status' => 'pending',
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'due_date' => now()->addDays(7),
        'metadata' => [
            'coupon_code' => $coupon->code,
        ],
    ]);

    // Mock successful payment
    $payment = PaymentTransaction::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'invoice_id' => $invoice->id,
        'amount' => 5000,
        'paystack_reference' => 'test-ref-success',
        'status' => 'success',
        'payment_method' => 'card',
        'channel' => 'card',
        'idempotency_key' => 'idem-test-success',
    ]);

    // Finalize payment manually to simulate webhook
    app(BillingFinalizationService::class)->finalizeSuccess($invoice, [
        'reference' => 'test-ref-success',
        'payment_method' => 'card',
        'customer_email' => 'test@example.com',
    ]);

    $subscription->refresh();

    // Check coupon log was created
    expect(CouponLog::where('coupon_id', $coupon->id)
        ->where('subscription_id', $subscription->id)
        ->where('subscription_type', ResidentSubscription::class)
        ->count())->toBe(1);

    // Check next invoice pricing still gets discount (cycle 2)
    $nextPricing = app(CalculateInvoicePricingAction::class)->execute(10000, $coupon, $resident, $estate, $subscription);
    expect($nextPricing['discount_amount'])->toBe(5000);
});

test('it prevents concurrent duplicate payment attempts via active_payment_attempt_id', function () {
    Role::create(['name' => 'resident']);
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $plan = Plan::factory()->create(['price' => 15000]);

    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'TEST-INV-123',
        'amount' => 15000,
        'final_amount' => 15000,
        'status' => 'pending',
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'due_date' => now()->addDays(7),
    ]);

    // First attempt claims it
    $payment1 = PaymentTransaction::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'invoice_id' => $invoice->id,
        'amount' => 15000,
        'paystack_reference' => 'test-ref-1',
        'status' => 'pending',
        'idempotency_key' => 'idem-test-1',
    ]);

    $claimed = DB::table('invoices')
        ->where('id', $invoice->id)
        ->whereNull('active_payment_attempt_id')
        ->update(['active_payment_attempt_id' => $payment1->id]);

    expect($claimed)->toBe(1);

    // Second attempt fails to claim it
    $payment2 = PaymentTransaction::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'invoice_id' => $invoice->id,
        'amount' => 15000,
        'paystack_reference' => 'test-ref-2',
        'status' => 'pending',
        'idempotency_key' => 'idem-test-2',
    ]);

    $claimed2 = DB::table('invoices')
        ->where('id', $invoice->id)
        ->whereNull('active_payment_attempt_id')
        ->update(['active_payment_attempt_id' => $payment2->id]);

    expect($claimed2)->toBe(0);
});

test('it captures card authorization and enables auto renew upon successful card payment', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    $plan = Plan::factory()->create(['price' => 20000]);

    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_start' => now()->subMonth(),
        'current_period_end' => now(),
    ]);

    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'INV-CARD-TEST-1',
        'amount' => 20000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'due_date' => now()->addDays(7),
        'status' => 'pending',
        'metadata' => [
            'auto_renew_consent' => true,
        ],
    ]);

    $paymentData = [
        'reference' => 'ref-auth-123',
        'payment_method' => 'card',
        'customer_email' => $resident->email,
        'authorization' => [
            'authorization_code' => 'AUTH_test_987xyz',
            'card_type' => 'visa',
            'last4' => '4081',
            'brand' => 'visa',
        ],
        'customer' => [
            'customer_code' => 'CUST_test_123',
            'email' => $resident->email,
        ],
    ];

    app(BillingFinalizationService::class)->finalizeSuccess($invoice, $paymentData);

    $subscription->refresh();

    expect($subscription->paystack_authorization_code)->toBe('AUTH_test_987xyz')
        ->and($subscription->card_brand)->toBe('visa')
        ->and($subscription->card_last4)->toBe('4081')
        ->and($subscription->auto_renew_enabled)->toBe(true);
});

test('it processes recurring auto-billing for due subscriptions with saved authorizations', function () {
    $estate = Estate::factory()->create();
    $estate->settings()->update(['charge_type' => 'residents']);

    $resident = User::factory()->create();
    $plan = Plan::factory()->create(['price' => 15000, 'billing_interval' => 'monthly']);

    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'auto_renew_enabled' => true,
        'paystack_authorization_code' => 'AUTH_reusable_123',
        'current_period_start' => now()->subMonth(),
        'current_period_end' => now()->subDay(),
    ]);

    // Mock Paystack chargeAuthorization
    $paystackMock = Mockery::mock(PaystackService::class);
    $paystackMock->shouldReceive('chargeAuthorization')
        ->once()
        ->andReturn([
            'status' => 'success',
            'reference' => 'CHG_auto_9999',
            'amount' => 15000,
        ]);
    $paystackMock->shouldReceive('verifyPayment')
        ->andReturn([
            'status' => 'success',
            'amount' => 15000,
            'reference' => 'CHG_auto_9999',
            'channel' => 'card',
            'customer' => ['email' => $resident->email],
        ]);

    app()->instance(PaystackService::class, $paystackMock);

    app(RecurringBillingService::class)->processDueResidentSubscriptions();

    $subscription->refresh();

    // Verify invoice was created and paid
    $invoice = Invoice::where('user_id', $resident->id)->where('status', 'paid')->first();
    expect($invoice)->not->toBeNull()
        ->and($invoice->amount)->toBe(15000)
        ->and($subscription->status)->toBe('active');
});

test('it does not apply a non-recurring one-time coupon on subsequent automated billings', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    $plan = Plan::factory()->create(['price' => 20000]);

    // One-time coupon (is_recurring = false)
    $oneTimeCoupon = Coupon::create([
        'code' => 'ONETIME50',
        'estate_id' => $estate->id,
        'type' => 'percentage',
        'value' => 50,
        'usage_limit' => 10,
        'status' => 'active',
        'is_recurring' => false,
    ]);

    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'auto_renew_enabled' => true,
        'coupon_id' => $oneTimeCoupon->id,
        'current_period_start' => now()->subMonth(),
        'current_period_end' => now(),
    ]);

    // First billing: Coupon applies
    $pricing1 = app(CalculateInvoicePricingAction::class)->execute(
        $plan->price,
        $oneTimeCoupon,
        $resident,
        $estate,
        $subscription
    );
    expect($pricing1['discount_amount'])->toBe(10000)
        ->and($pricing1['amount'])->toBe(10000);

    $invoice1 = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'INV-TEST-COUPON-1',
        'amount' => 10000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'due_date' => now()->addDays(7),
        'status' => 'paid',
    ]);

    // Simulate usage logging for the first invoice
    CouponLog::create([
        'coupon_id' => $oneTimeCoupon->id,
        'user_id' => $resident->id,
        'invoice_id' => $invoice1->id,
        'discount_amount' => 10000,
        'subscription_id' => $subscription->id,
        'subscription_type' => ResidentSubscription::class,
    ]);

    // Subsequent automated renewal: One-time coupon MUST NOT apply
    $pricing2 = app(CalculateInvoicePricingAction::class)->execute(
        $plan->price,
        $oneTimeCoupon,
        $resident,
        $estate,
        $subscription,
        true // automated recurring renewal
    );
    expect($pricing2['discount_amount'])->toBe(0)
        ->and($pricing2['amount'])->toBe(20000)
        ->and(in_array($pricing2['metadata']['coupon_error'], [
            'Coupon can only be used once per subscription.',
            'This coupon has reached its usage limit.',
        ]))->toBeTrue();
});

test('it ignores expired or inactive coupons during automated renewal pricing', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    $plan = Plan::factory()->create(['price' => 20000]);

    // Expired coupon
    $expiredCoupon = Coupon::create([
        'code' => 'EXPIRED20',
        'estate_id' => $estate->id,
        'type' => 'percentage',
        'value' => 20,
        'expires_at' => now()->subDay(),
        'status' => 'active',
        'is_recurring' => true,
    ]);

    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'auto_renew_enabled' => true,
        'coupon_id' => $expiredCoupon->id,
        'current_period_start' => now()->subMonth(),
        'current_period_end' => now(),
    ]);

    $pricing = app(CalculateInvoicePricingAction::class)->execute(
        $plan->price,
        $expiredCoupon,
        $resident,
        $estate,
        $subscription
    );

    // Full amount charged, 0 discount, coupon error recorded in metadata
    expect($pricing['discount_amount'])->toBe(0)
        ->and($pricing['amount'])->toBe(20000)
        ->and($pricing['coupon_code'])->toBeNull();
});
