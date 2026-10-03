<?php

use App\Jobs\Billing\RecheckInitiatedCollectionPaymentsJob;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\Payment;
use App\Models\User;
use App\Services\Billing\CollectionPaymentSettler;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['paystack.base_url' => 'https://api.paystack.co', 'paystack.secret_key' => 'sk_test_x']);
    Notification::fake();

    $this->estate = Estate::factory()->create();
    $this->resident = User::factory()->create();
    $this->collection = Collection::factory()->create(['estate_id' => $this->estate->id, 'created_by' => $this->resident->id]);

    $this->charge = fn (string $reference, string $status = 'initiated', int $minutesOld = 30) => tap(Payment::create([
        'user_id' => $this->resident->id, 'estate_id' => $this->estate->id,
        'collection_assignment_id' => CollectionAssignment::factory()->create([
            'collection_id' => $this->collection->id, 'estate_id' => $this->estate->id, 'user_id' => $this->resident->id,
            'amount_due' => 500000, 'amount_paid' => 0, 'status' => 'pending', 'due_date' => now()->addWeek()->toDateString(),
        ])->id,
        'amount' => 500000, 'provider' => 'paystack', 'reference' => $reference, 'status' => $status,
    ]), fn (Payment $p) => $p->forceFill(['created_at' => now()->subMinutes($minutesOld)])->saveQuietly());

    $this->paystackSays = fn (string $status, string $channel = 'bank_transfer') => ['status' => true, 'message' => 'ok', 'data' => [
        'status' => $status, 'channel' => $channel, 'amount' => 500000, 'customer' => ['email' => 'a@b.c'],
    ]];

    $this->runCheck = fn () => (new RecheckInitiatedCollectionPaymentsJob)->handle(app(PaystackService::class), app(CollectionPaymentSettler::class));
});

it('settles a payment whose webhook was missed once Paystack confirms it', function () {
    $payment = ($this->charge)('COLL-MISSED-1');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success'))]);

    ($this->runCheck)();

    expect($payment->fresh()->status)->toBe('success')
        ->and($payment->assignment()->withoutGlobalScopes()->first()->amount_paid)->toBe(500000);
});

it('counts the money once even if the check runs again', function () {
    $payment = ($this->charge)('COLL-TWICE-1');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success'))]);

    ($this->runCheck)();
    ($this->runCheck)();

    expect($payment->assignment()->withoutGlobalScopes()->first()->amount_paid)->toBe(500000);
});

it('marks a payment failed when Paystack says it failed or was abandoned', function () {
    $failed = ($this->charge)('COLL-FAILED-1');
    $abandoned = ($this->charge)('COLL-ABANDONED-1');
    Http::fake([
        'api.paystack.co/transaction/verify/COLL-FAILED-1' => Http::response(($this->paystackSays)('failed')),
        'api.paystack.co/transaction/verify/COLL-ABANDONED-1' => Http::response(($this->paystackSays)('abandoned')),
    ]);

    ($this->runCheck)();

    expect($failed->fresh()->status)->toBe('failed')->and($abandoned->fresh()->status)->toBe('failed');
});

it('leaves a payment alone while Paystack still says it is in flight', function () {
    $payment = ($this->charge)('COLL-ONGOING-1');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('ongoing'))]);

    ($this->runCheck)();

    expect($payment->fresh()->status)->toBe('initiated');
});

it('does not touch a payment that is still fresh or one that is a week old', function () {
    $fresh = ($this->charge)('COLL-FRESH-1', 'initiated', 3);
    $stale = ($this->charge)('COLL-STALE-1', 'initiated', 60 * 24 * 8);
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success'))]);

    ($this->runCheck)();

    expect($fresh->fresh()->status)->toBe('initiated')->and($stale->fresh()->status)->toBe('initiated');
    Http::assertNothingSent();
});

it('does not grant value for a collection paid by card', function () {
    $payment = ($this->charge)('COLL-CARD-1');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success', 'card'))]);

    ($this->runCheck)();

    expect($payment->fresh()->status)->toBe('failed')
        ->and($payment->assignment()->withoutGlobalScopes()->first()->amount_paid)->toBe(0);
});

it('keeps going when Paystack cannot be reached for one payment', function () {
    $broken = ($this->charge)('COLL-BROKEN-1');
    $fine = ($this->charge)('COLL-FINE-1');
    Http::fake([
        'api.paystack.co/transaction/verify/COLL-BROKEN-1' => Http::response(['message' => 'down'], 500),
        'api.paystack.co/transaction/verify/COLL-FINE-1' => Http::response(($this->paystackSays)('success')),
    ]);

    ($this->runCheck)();

    expect($broken->fresh()->status)->toBe('initiated')->and($fine->fresh()->status)->toBe('success');
});

it('refuses to credit a payment through the public verify route unless Paystack confirms it', function () {
    $payment = ($this->charge)('COLL-PUBLIC-1');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('abandoned'))]);

    $this->postJson(route('web.billing.collection.verify', 'COLL-PUBLIC-1'))->assertStatus(409);

    expect($payment->fresh()->status)->toBe('initiated')
        ->and($payment->assignment()->withoutGlobalScopes()->first()->amount_paid)->toBe(0);
});

it('answers the public verify route calmly when Paystack cannot be reached, and credits nothing', function () {
    $payment = ($this->charge)('COLL-PUBLIC-2');
    Http::fake(['api.paystack.co/*' => Http::response(['message' => 'down'], 503)]);

    $this->postJson(route('web.billing.collection.verify', 'COLL-PUBLIC-2'))->assertStatus(502);

    expect($payment->fresh()->status)->toBe('initiated');
});

it('credits through the public verify route once Paystack confirms a bank transfer', function () {
    $payment = ($this->charge)('COLL-PUBLIC-3');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success'))]);

    $this->postJson(route('web.billing.collection.verify', 'COLL-PUBLIC-3'))->assertOk();

    expect($payment->fresh()->status)->toBe('success');
});
