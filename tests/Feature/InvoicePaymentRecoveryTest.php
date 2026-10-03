<?php

use App\Actions\Billing\RecordPaymentAction;
use App\Jobs\Billing\RecheckPendingInvoicePaymentsJob;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['paystack.base_url' => 'https://api.paystack.co', 'paystack.secret_key' => 'sk_test_x']);
    Notification::fake();

    $this->estate = Estate::factory()->create();
    $this->user = User::factory()->create();
    $this->plan = Plan::factory()->create(['price' => 500000]);

    EstateSubscription::factory()->create(['estate_id' => $this->estate->id, 'plan_id' => $this->plan->id, 'billing_interval' => 'annually', 'status' => 'active']);
    ResidentSubscription::factory()->create(['user_id' => $this->user->id, 'estate_id' => $this->estate->id, 'status' => 'past_due', 'current_period_end' => now()->subDay()]);

    $this->pending = function (string $reference, int $minutesOld = 30, array $metadata = [], int $amount = 500000) {
        $invoice = Invoice::factory()->create([
            'user_id' => $this->user->id, 'estate_id' => $this->estate->id, 'plan_id' => $this->plan->id,
            'invoice_number' => $reference, 'amount' => $amount, 'status' => 'pending',
        ]);

        $transaction = PaymentTransaction::create([
            'invoice_id' => $invoice->id, 'estate_id' => $this->estate->id, 'paystack_reference' => $reference,
            'idempotency_key' => (string) Str::uuid(), 'amount' => $amount, 'currency' => 'NGN', 'status' => 'pending',
            'attempt_count' => 1, 'metadata' => $metadata ?: null,
        ]);
        $transaction->forceFill(['created_at' => now()->subMinutes($minutesOld)])->saveQuietly();

        return [$invoice, $transaction];
    };

    $this->paystackSays = fn (string $status, int $amount = 500000) => ['status' => true, 'message' => 'ok', 'data' => [
        'status' => $status, 'reference' => 'x', 'amount' => $amount, 'channel' => 'card',
        'customer' => ['email' => 'a@b.c'], 'authorization' => ['authorization_code' => 'AUTH_x', 'brand' => 'visa', 'last4' => '4444'],
    ]];

    $this->runCheck = fn () => (new RecheckPendingInvoicePaymentsJob)->handle(app(PaystackService::class), app(RecordPaymentAction::class));
});

it('records an invoice payment whose webhook and return trip were both lost, once Paystack confirms it', function () {
    [$invoice, $transaction] = ($this->pending)('KTRL-RC-0001');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success'))]);

    ($this->runCheck)();

    expect($invoice->fresh()->isPaid())->toBeTrue()
        ->and($transaction->fresh()->status)->toBe('success');
});

it('records it exactly once however often the check runs', function () {
    [$invoice, $transaction] = ($this->pending)('KTRL-RC-0002');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success'))]);

    ($this->runCheck)();
    ($this->runCheck)();

    expect($invoice->fresh()->isPaid())->toBeTrue()
        ->and(PaymentTransaction::where('paystack_reference', 'KTRL-RC-0002')->count())->toBe(1);
});

it('marks an attempt failed when Paystack says it was abandoned, and leaves the invoice owing', function () {
    [$invoice, $transaction] = ($this->pending)('KTRL-RC-0003');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('abandoned'))]);

    ($this->runCheck)();

    expect($transaction->fresh()->status)->toBe('failed')
        ->and($transaction->fresh()->error_code)->toBe('PAYSTACK_ABANDONED')
        ->and($invoice->fresh()->isPaid())->toBeFalse();
});

it('does not mark a payment failed while Paystack says it is still in flight', function () {
    [$invoice, $transaction] = ($this->pending)('KTRL-RC-0004');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('ongoing'))]);

    ($this->runCheck)();

    expect($transaction->fresh()->status)->toBe('pending')
        ->and($transaction->fresh()->last_checked_at)->not->toBeNull();
});

it('does not credit an invoice when Paystack reports a different amount', function () {
    [$invoice, $transaction] = ($this->pending)('KTRL-RC-0005');
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success', 100))]);

    ($this->runCheck)();

    expect($invoice->fresh()->isPaid())->toBeFalse();
});

it('leaves alone attempts that are too fresh, too old, card setups, and invoices already paid', function () {
    [, $fresh] = ($this->pending)('KTRL-RC-0006', 3);
    [, $old] = ($this->pending)('KTRL-RC-0007', 60 * 24 * 8);
    [, $setup] = ($this->pending)('KTRL-RC-0008', 30, ['type' => 'card_setup']);
    [$paidInvoice, $paid] = ($this->pending)('KTRL-RC-0009');
    $paidInvoice->update(['status' => 'paid']);
    Http::fake(['api.paystack.co/*' => Http::response(($this->paystackSays)('success'))]);

    ($this->runCheck)();

    expect([$fresh, $old, $setup, $paid])->each(fn ($t) => expect($t->value->fresh()->status)->toBe('pending'));
    Http::assertNothingSent();
});

it('keeps going when Paystack cannot be reached for one payment', function () {
    [, $broken] = ($this->pending)('KTRL-RC-0010');
    [$fineInvoice] = ($this->pending)('KTRL-RC-0011');
    Http::fake([
        'api.paystack.co/transaction/verify/KTRL-RC-0010' => Http::response(['message' => 'down'], 500),
        'api.paystack.co/transaction/verify/KTRL-RC-0011' => Http::response(($this->paystackSays)('success')),
    ]);

    ($this->runCheck)();

    expect($broken->fresh()->status)->toBe('pending')
        ->and($fineInvoice->fresh()->isPaid())->toBeTrue();
});
