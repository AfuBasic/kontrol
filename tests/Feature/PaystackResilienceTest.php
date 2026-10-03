<?php

use App\Services\PaystackService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config(['paystack.base_url' => 'https://api.paystack.co', 'paystack.secret_key' => 'sk_test_x']);
    Cache::forget('paystack_banks_nigeria');
});

function verifyBody(string $reference = 'ref_1'): array
{
    return ['status' => true, 'message' => 'ok', 'data' => ['status' => 'success', 'reference' => $reference, 'amount' => 100000, 'customer' => ['email' => 'a@b.c']]];
}

it('quietly retries a verification when Paystack has a hiccup', function () {
    Http::fake(['api.paystack.co/*' => Http::sequence()->push(['message' => 'busy'], 503)->push(verifyBody())]);

    $result = app(PaystackService::class)->verifyPayment('ref_1');

    expect($result['status'])->toBe('success');
    Http::assertSentCount(2);
});

it('quietly retries a verification when the connection drops', function () {
    Http::fake(['api.paystack.co/*' => Http::sequence()->pushFailedConnection()->push(verifyBody())]);

    expect(app(PaystackService::class)->verifyPayment('ref_1')['status'])->toBe('success');
    Http::assertSentCount(2);
});

it('does not retry when Paystack answers that the payment is wrong', function () {
    Http::fake(['api.paystack.co/*' => Http::sequence()->push(['message' => 'Transaction reference not found'], 404)->push(verifyBody())]);

    expect(fn () => app(PaystackService::class)->verifyPayment('nope'))->toThrow(Exception::class, 'Failed to verify');
    Http::assertSentCount(1);
});

it('never repeats a write: a failed initialisation is attempted once', function () {
    Http::fake(['api.paystack.co/*' => Http::sequence()->push(['message' => 'busy'], 503)->push(['data' => ['authorization_url' => 'x', 'access_code' => 'y', 'reference' => 'z']])]);

    expect(fn () => app(PaystackService::class)->initializeTransaction('a@b.c', 100000, 'https://example.test/cb'))->toThrow(Exception::class);
    Http::assertSentCount(1);
});

it('does not remember a failed bank list for a day', function () {
    Http::fake(['api.paystack.co/*' => Http::sequence()
        ->push(['message' => 'down'], 500)->push(['message' => 'down'], 500)->push(['message' => 'down'], 500)
        ->push(['data' => [['name' => 'Access Bank', 'code' => '044']]])]);

    expect(app(PaystackService::class)->getBanks())->toBe([])
        ->and(Cache::has('paystack_banks_nigeria'))->toBeFalse()
        ->and(app(PaystackService::class)->getBanks())->toHaveCount(1)
        ->and(Cache::has('paystack_banks_nigeria'))->toBeTrue();
});
