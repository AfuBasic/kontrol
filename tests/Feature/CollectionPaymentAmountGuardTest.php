<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Models\Scopes\PaymentScope;
use App\Models\User;
use App\Services\Billing\CollectionPaymentSettler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Config::set('paystack.secret_key', 'test_secret_key');
    Notification::fake();

    $this->estate = Estate::factory()->create();
    $this->resident = User::factory()->create();
    $collection = Collection::factory()->create(['estate_id' => $this->estate->id, 'created_by' => $this->resident->id]);

    $this->assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id, 'estate_id' => $this->estate->id, 'user_id' => $this->resident->id,
        'amount_due' => 1000, 'amount_paid' => 0, 'status' => 'pending', 'due_date' => now()->addWeek()->toDateString(),
    ]);

    $this->payment = fn (array $rawPayload = []) => Payment::create([
        'user_id' => $this->resident->id, 'estate_id' => $this->estate->id, 'collection_assignment_id' => $this->assignment->id,
        'amount' => 1000, 'provider' => 'paystack', 'reference' => 'COLL-GUARD-0001', 'status' => 'initiated',
        'raw_payload' => $rawPayload ?: null,
    ]);

    $this->webhook = function (int $amountKobo) {
        $json = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'COLL-GUARD-0001', 'amount' => $amountKobo, 'channel' => 'bank_transfer', 'customer' => ['email' => 'a@b.c']]]);

        return $this->call('POST', '/webhooks/paystack', [], [], [], [
            'HTTP_X_PAYSTACK_SIGNATURE' => hash_hmac('sha512', $json, 'test_secret_key'),
            'CONTENT_TYPE' => 'application/json',
        ], $json);
    };
});

it('refuses to credit a payment when Paystack reports less than was asked for', function () {
    $payment = ($this->payment)(['expected_kobo' => 102031]);

    // Directly, so we see the refusal itself and not just an unchanged payment.
    $result = app(CollectionPaymentSettler::class)->settle('COLL-GUARD-0001', 50000);

    expect($result)->toMatchArray(['status' => 409, 'settled' => false])
        ->and($result['error'])->toContain('less than expected')
        ->and($payment->fresh()->status)->toBe('initiated')
        ->and($this->assignment->fresh()->amount_paid)->toBe(0);

    // And through the webhook, the same refusal.
    ($this->webhook)(50000)->assertOk();

    expect($payment->fresh()->status)->toBe('initiated')
        ->and($this->assignment->fresh()->amount_paid)->toBe(0);
});

it('credits a payment when Paystack reports exactly what was asked for', function () {
    $payment = ($this->payment)(['expected_kobo' => 102031]);

    ($this->webhook)(102031)->assertOk();

    expect($payment->fresh()->status)->toBe('success')
        ->and($this->assignment->fresh()->amount_paid)->toBe(1000);
});

it('still credits a payment made before the expected amount was recorded', function () {
    $payment = ($this->payment)();

    ($this->webhook)(50000)->assertOk();

    expect($payment->fresh()->status)->toBe('success');
});

it('records the amount it asked Paystack to collect when a payment is started', function () {
    EstateSettings::forEstate($this->estate->id)->update(['paystack_subaccount_code' => 'ACCT_ESTATE_123']);
    Http::fake([
        'api.paystack.co/transaction/initialize' => Http::response(['status' => true, 'message' => 'ok', 'data' => ['authorization_url' => 'https://checkout.paystack.com/x', 'access_code' => 'ac', 'reference' => 'r']]),
        'api.paystack.co/*' => Http::response(['status' => false, 'message' => 'not found'], 404),
    ]);

    $response = $this->postJson(route('web.billing.collection.initiate', ['assignment' => $this->assignment->ulid]))->assertSuccessful();

    $payment = Payment::withoutGlobalScope(PaymentScope::class)->where('reference', $response->json('reference'))->firstOrFail();

    expect($payment->raw_payload['expected_kobo'])->toBe($response->json('amount_kobo'));
});
