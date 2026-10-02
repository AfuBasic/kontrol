<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
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
        'amount_due' => 500000, 'amount_paid' => 0, 'status' => 'pending', 'due_date' => now()->addWeek()->toDateString(),
    ]);

    $this->payment = Payment::create([
        'user_id' => $this->resident->id, 'estate_id' => $this->estate->id, 'collection_assignment_id' => $this->assignment->id,
        'amount' => 500000, 'provider' => 'paystack', 'reference' => 'COLL-TEST-0001', 'status' => 'initiated',
    ]);

    $this->webhook = function (string $channel) {
        $json = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'COLL-TEST-0001', 'amount' => 500000, 'channel' => $channel, 'customer' => ['email' => 'a@b.c']]]);

        return $this->call('POST', '/webhooks/paystack', [], [], [], [
            'HTTP_X_PAYSTACK_SIGNATURE' => hash_hmac('sha512', $json, 'test_secret_key'),
            'CONTENT_TYPE' => 'application/json',
        ], $json);
    };
});

it('marks a collection payment and its charge as paid when the bank transfer succeeds', function () {
    ($this->webhook)('bank_transfer')->assertOk();

    expect($this->payment->fresh()->status)->toBe('success')
        ->and($this->assignment->fresh()->status)->toBe('paid')
        ->and($this->assignment->fresh()->amount_paid)->toBe(500000);
});

it('refuses to grant value for a collection paid through a channel that is not bank transfer', function () {
    ($this->webhook)('card')->assertOk();

    expect($this->payment->fresh()->status)->toBe('initiated')
        ->and($this->assignment->fresh()->amount_paid)->toBe(0);
});

it('does not count the same payment twice when Paystack sends the webhook again', function () {
    ($this->webhook)('bank_transfer')->assertOk();
    ($this->webhook)('bank_transfer')->assertOk();

    expect($this->assignment->fresh()->amount_paid)->toBe(500000);
});
