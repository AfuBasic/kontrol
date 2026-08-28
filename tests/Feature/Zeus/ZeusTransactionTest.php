<?php

use App\Models\Estate;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;



test('guests are redirected to zeus login when viewing transactions', function () {
    $response = $this->get(route('zeus.transactions.index'));

    $response->assertRedirect(route('zeus.login'));
});

test('zeus admin can view the transactions index with enriched relations', function () {
    $sessionKey = config('zeus.session_key');

    $estate = Estate::factory()->create(['name' => 'Sunset Ridge']);
    $user = User::factory()->create(['name' => 'Chidera Obi', 'email' => 'chidera@example.com']);
    $plan = Plan::factory()->create(['name' => 'Kontrol Monthly', 'billing_interval' => 'monthly']);

    $invoice = Invoice::factory()->create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-TEST001',
        'amount' => 50000,
        'resident_count' => 3,
        'billing_period_start' => now()->startOfMonth(),
        'billing_period_end' => now()->endOfMonth(),
        'due_date' => now()->addDays(7),
        'status' => 'paid',
        'paid_at' => now(),
    ]);

    PaymentTransaction::create([
        'invoice_id' => $invoice->id,
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'paystack_reference' => 'KTRL-REF123',
        'provider' => 'paystack',
        'idempotency_key' => 'idem-001',
        'amount' => 50000,
        'currency' => 'NGN',
        'status' => 'success',
        'payment_method' => 'card',
        'customer_email' => 'chidera@example.com',
        'verified_at' => now(),
        'recorded_at' => now(),
        'attempt_count' => 1,
        'metadata' => ['coupon_code' => 'DISC10'],
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->get(route('zeus.transactions.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Zeus/Transactions/Index')
        ->has('transactions.data', 1)
        ->has('transactions.data.0', fn (Assert $tx) => $tx
            ->where('paystack_reference', 'KTRL-REF123')
            ->where('provider', 'paystack')
            ->where('currency', 'NGN')
            ->where('amount', 50000)
            ->where('status', 'success')
            ->where('payment_method', 'card')
            ->where('attempt_count', 1)
            ->has('user')
            ->where('user.name', 'Chidera Obi')
            ->has('estate')
            ->where('estate.name', 'Sunset Ridge')
            ->has('invoice')
            ->where('invoice.invoice_number', 'KTRL-TEST001')
            ->where('invoice.resident_count', 3)
            ->has('invoice.plan')
            ->where('invoice.plan.name', 'Kontrol Monthly')
            ->where('invoice.plan.billing_interval', 'monthly')
            ->etc()
        )
        ->has('stats')
        ->has('volumeTrend')
    );
});

test('zeus admin can view a single enriched transaction via show endpoint', function () {
    $sessionKey = config('zeus.session_key');

    $estate = Estate::factory()->create(['name' => 'Victoria Palms', 'billing_mode' => 'estate_pays']);
    $user = User::factory()->create(['name' => 'Amaka Nwosu', 'email' => 'amaka@example.com']);
    $plan = Plan::factory()->create(['name' => 'Kontrol Semi-Annually', 'billing_interval' => 'semi-annually']);

    $invoice = Invoice::factory()->create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-SHOW002',
        'amount' => 108000,
        'resident_count' => 5,
        'billing_period_start' => now()->startOfMonth(),
        'billing_period_end' => now()->addMonths(6),
        'due_date' => now()->addDays(7),
        'status' => 'paid',
        'paid_at' => now(),
        'metadata' => ['subtotal' => 180000, 'coupon_code' => 'SAVE40', 'discount_amount' => 72000],
    ]);

    $transaction = PaymentTransaction::create([
        'invoice_id' => $invoice->id,
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'paystack_reference' => 'KTRL-SHOW-REF',
        'provider' => 'paystack',
        'idempotency_key' => 'idem-002',
        'amount' => 108000,
        'currency' => 'NGN',
        'status' => 'success',
        'payment_method' => 'card',
        'customer_email' => 'amaka@example.com',
        'verified_at' => now(),
        'recorded_at' => now(),
        'attempt_count' => 1,
        'metadata' => ['coupon_code' => 'SAVE40'],
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->getJson(route('zeus.transactions.show', $transaction));

    $response->assertOk()
        ->assertJsonPath('paystack_reference', 'KTRL-SHOW-REF')
        ->assertJsonPath('provider', 'paystack')
        ->assertJsonPath('currency', 'NGN')
        ->assertJsonPath('amount', 108000)
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('user.name', 'Amaka Nwosu')
        ->assertJsonPath('estate.name', 'Victoria Palms')
        ->assertJsonPath('estate.billing_mode', 'estate_pays')
        ->assertJsonPath('invoice.invoice_number', 'KTRL-SHOW002')
        ->assertJsonPath('invoice.resident_count', 5)
        ->assertJsonPath('invoice.plan.name', 'Kontrol Semi-Annually')
        ->assertJsonPath('invoice.metadata.coupon_code', 'SAVE40')
        ->assertJsonPath('invoice.metadata.discount_amount', 72000);
});

test('failed transactions include error_code and error_message in show response', function () {
    $sessionKey = config('zeus.session_key');

    $estate = Estate::factory()->create();

    $transaction = PaymentTransaction::create([
        'estate_id' => $estate->id,
        'paystack_reference' => 'KTRL-FAIL-001',
        'provider' => 'paystack',
        'idempotency_key' => 'idem-fail',
        'amount' => 30000,
        'currency' => 'NGN',
        'status' => 'failed',
        'payment_method' => 'card',
        'customer_email' => 'fail@example.com',
        'error_code' => 'insufficient_funds',
        'error_message' => 'Your card has insufficient funds.',
        'attempt_count' => 2,
        'metadata' => null,
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->getJson(route('zeus.transactions.show', $transaction));

    $response->assertOk()
        ->assertJsonPath('status', 'failed')
        ->assertJsonPath('error_code', 'insufficient_funds')
        ->assertJsonPath('error_message', 'Your card has insufficient funds.');
});
