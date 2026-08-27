<?php

use App\Actions\Billing\CalculateInvoicePricingAction;
use App\Actions\Billing\ProcessResidentPaymentAction;
use App\Actions\Billing\GenerateInvoiceAction;
use App\Models\Coupon;
use App\Models\CouponLog;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
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
    app(\App\Services\Billing\BillingFinalizationService::class)->finalizeSuccess($invoice, [
        'reference' => 'test-ref-success',
        'payment_method' => 'card',
        'customer_email' => 'test@example.com'
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
