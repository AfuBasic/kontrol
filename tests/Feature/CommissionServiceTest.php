<?php

use App\Enums\CommissionStatus;
use App\Models\CommissionableRevenue;
use App\Models\CommissionPlan;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\Partner;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\Billing\BillingFinalizationService;
use App\Services\Commission\CommissionService;
use App\Services\Commission\PartnerAttributionService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function makePartneredEstate(array $partnerAttrs = [], array $planAttrs = [], array $estateAttrs = []): array
{
    $partner = Partner::factory()->create(array_merge([
        'commission_type' => 'percentage',
        'commission_rate' => 10,
        'commission_length' => 6,
    ], $partnerAttrs));

    $plan = CommissionPlan::factory()->create(array_merge([
        'source_partner_id' => $partner->id,
        'commission_rate' => $partner->commission_rate,
        'commission_type' => $partner->commission_type,
        'duration_months' => $partner->commission_length,
    ], $planAttrs));

    $estate = Estate::factory()->create(array_merge([
        'partner_id' => $partner->id,
        'commission_plan_id' => $plan->id,
        'commission_status' => CommissionStatus::Active,
        'commission_starts_at' => now()->subYear(),
        'commission_ends_at' => null,
    ], $estateAttrs));

    return [$partner, $plan, $estate];
}

function makePayment(Estate $estate, int $amount = 100000, ?CarbonImmutable $at = null): PaymentTransaction
{
    $at = $at ?? CarbonImmutable::now();

    return PaymentTransaction::create([
        'estate_id' => $estate->id,
        'paystack_reference' => 'ref_'.uniqid(),
        'idempotency_key' => 'idem_'.uniqid(),
        'amount' => $amount,
        'currency' => 'NGN',
        'status' => 'success',
        'verified_at' => $at,
        'created_at' => $at,
        'updated_at' => $at,
    ]);
}

it('allows commission when estate is partnered and active regardless of estate ends_at', function () {
    [, , $estate] = makePartneredEstate(
        estateAttrs: ['commission_ends_at' => now()->subDay()],
    );

    $inactive = Estate::factory()->create([
        'partner_id' => $estate->partner_id,
        'commission_plan_id' => $estate->commission_plan_id,
        'commission_status' => CommissionStatus::Inactive,
        'commission_starts_at' => now()->subDay(),
        'commission_ends_at' => null,
    ]);

    $service = app(CommissionService::class);

    expect($service->eligibleForCommission($estate))->toBeTrue()
        ->and($service->eligibleForCommission($inactive))->toBeFalse();
});

it('does not generate commission while resident is on trial', function () {
    [, , $estate] = makePartneredEstate(['commission_length' => 6]);
    $resident = User::factory()->create();
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'status' => 'trial',
        'trial_ends_at' => now()->addMonth(),
        'current_period_start' => now()->subDays(5),
        'current_period_end' => now()->addMonth(),
    ]);

    $service = app(CommissionService::class);
    $tx = makePayment($estate);

    expect($service->generateCommission($resident, $tx))->toBeNull();
});

it('accrues partner commission when a resident subscription invoice is finalized', function () {
    Notification::fake();

    [$partner, , $estate] = makePartneredEstate(
        ['commission_rate' => 10, 'commission_type' => 'percentage', 'commission_length' => null],
        ['commission_rate' => 10, 'commission_type' => 'percentage', 'duration_months' => null],
    );

    $billingPlan = Plan::factory()->create([
        'price' => 100000,
        'billing_interval' => 'monthly',
    ]);

    $resident = User::factory()->create(['email' => 'subscriber@example.com']);
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'past_due',
        'trial_ends_at' => null,
        'current_period_start' => now()->subDay(),
        'current_period_end' => now()->subMinute(),
    ]);

    $invoice = Invoice::factory()->create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $billingPlan->id,
        'amount' => 100000,
        'paystack_reference' => 'sub_ref_1',
    ]);

    $billing = app(BillingFinalizationService::class);

    $billing->finalizeSuccess($invoice, [
        'reference' => 'sub_ref_1',
        'payment_method' => 'card',
        'customer_email' => $resident->email,
    ]);

    $revenue = CommissionableRevenue::where('partner_id', $partner->id)->first();

    expect($revenue)->not->toBeNull()
        ->and($revenue->estate_id)->toBe($estate->id)
        ->and($revenue->user_id)->toBe($resident->id)
        ->and($revenue->revenue_amount)->toBe(100000)
        ->and($revenue->commission_amount)->toBe(10000)
        ->and($revenue->payment_transaction_id)->not->toBeNull();

    $billing->finalizeSuccess($invoice->fresh(), [
        'reference' => 'sub_ref_1',
        'payment_method' => 'card',
        'customer_email' => $resident->email,
    ]);

    expect(CommissionableRevenue::where('partner_id', $partner->id)->count())->toBe(1);
});

it('backfills missing partner commissions for existing successful resident payments', function () {
    [$partner, , $estate] = makePartneredEstate(
        ['commission_rate' => 15, 'commission_type' => 'percentage', 'commission_length' => null],
        ['commission_rate' => 15, 'commission_type' => 'percentage', 'duration_months' => null],
    );

    $billingPlan = Plan::factory()->create([
        'price' => 200000,
        'billing_interval' => 'monthly',
    ]);

    $resident = User::factory()->create(['email' => 'legacy-subscriber@example.com']);
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $billingPlan->id,
        'status' => 'active',
        'trial_ends_at' => null,
        'current_period_start' => now()->subDay(),
        'current_period_end' => now()->addMonth(),
    ]);

    $invoice = Invoice::factory()->create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $billingPlan->id,
        'amount' => 200000,
        'status' => 'paid',
        'paystack_reference' => 'legacy_ref_1',
    ]);

    $transaction = PaymentTransaction::create([
        'invoice_id' => $invoice->id,
        'estate_id' => $estate->id,
        'user_id' => null,
        'paystack_reference' => 'legacy_ref_1',
        'idempotency_key' => 'legacy_ref_1',
        'amount' => 200000,
        'currency' => 'NGN',
        'status' => 'success',
        'payment_method' => 'card',
        'customer_email' => $resident->email,
        'verified_at' => now(),
        'recorded_at' => now(),
    ]);

    expect(Artisan::call('kontrol:backfill-partner-commissions'))->toBe(0);

    $revenue = CommissionableRevenue::where('payment_transaction_id', $transaction->id)->first();

    expect($revenue)->not->toBeNull()
        ->and($revenue->partner_id)->toBe($partner->id)
        ->and($revenue->commission_amount)->toBe(30000)
        ->and($transaction->fresh()->user_id)->toBe($resident->id);

    expect(Artisan::call('kontrol:backfill-partner-commissions'))->toBe(0)
        ->and(CommissionableRevenue::where('payment_transaction_id', $transaction->id)->count())->toBe(1);
});

it('starts commission tenure the day trial ends, not when resident was added', function () {
    [, , $estate] = makePartneredEstate(['commission_length' => 6]);
    $resident = User::factory()->create();
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $addedAt = CarbonImmutable::parse('2026-01-01');
    $trialEnds = CarbonImmutable::parse('2026-02-01');
    // 1 month trial + 5 paid months later = still inside 6m from trial end
    $paymentAt = CarbonImmutable::parse('2026-06-15');

    ResidentSubscription::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'status' => 'active',
        'trial_ends_at' => $trialEnds,
        'current_period_start' => $trialEnds,
        'current_period_end' => $trialEnds->addMonth(),
        'created_at' => $addedAt,
        'updated_at' => $paymentAt,
    ]);

    $service = app(CommissionService::class);
    $tx = makePayment($estate, 100000, $paymentAt);
    $revenue = $service->generateCommission($resident, $tx);

    expect($revenue)->not->toBeNull()
        ->and($revenue->commission_amount)->toBe(10000);
});

it('stops commission after N months from post-trial start even if estate is older', function () {
    [, , $estate] = makePartneredEstate(['commission_length' => 6]);
    $resident = User::factory()->create();
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $trialEnds = CarbonImmutable::parse('2026-01-01');
    // 7 months after trial end - outside 6m tenure
    $paymentAt = CarbonImmutable::parse('2026-08-02');

    ResidentSubscription::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'status' => 'active',
        'trial_ends_at' => $trialEnds,
        'current_period_start' => $trialEnds,
        'current_period_end' => $trialEnds->addMonth(),
        'created_at' => $trialEnds->subMonth(),
    ]);

    $service = app(CommissionService::class);
    $tx = makePayment($estate, 100000, $paymentAt);

    expect($service->generateCommission($resident, $tx))->toBeNull();
});

it('allows commission indefinitely when partner length is always', function () {
    [, , $estate] = makePartneredEstate(
        ['commission_length' => null],
        ['duration_months' => null],
    );
    $resident = User::factory()->create();
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $trialEnds = CarbonImmutable::parse('2024-01-01');
    $paymentAt = CarbonImmutable::parse('2026-06-01');

    ResidentSubscription::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'status' => 'active',
        'trial_ends_at' => $trialEnds,
        'current_period_start' => $trialEnds,
        'current_period_end' => $paymentAt->addMonth(),
        'created_at' => $trialEnds->subMonth(),
    ]);

    $service = app(CommissionService::class);
    $tx = makePayment($estate, 50000, $paymentAt);
    $revenue = $service->generateCommission($resident, $tx);

    expect($revenue)->not->toBeNull()
        ->and($revenue->commission_amount)->toBe(5000);
});

it('uses independent tenure clocks per resident', function () {
    [, , $estate] = makePartneredEstate(['commission_length' => 6]);
    $service = app(CommissionService::class);

    $ada = User::factory()->create();
    $ben = User::factory()->create();
    $ada->estates()->attach($estate->id, ['status' => 'accepted']);
    $ben->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::factory()->create([
        'user_id' => $ada->id,
        'estate_id' => $estate->id,
        'status' => 'active',
        'trial_ends_at' => CarbonImmutable::parse('2025-06-01'),
        'current_period_start' => CarbonImmutable::parse('2025-06-01'),
        'current_period_end' => CarbonImmutable::parse('2025-07-01'),
    ]);

    ResidentSubscription::factory()->create([
        'user_id' => $ben->id,
        'estate_id' => $estate->id,
        'status' => 'active',
        'trial_ends_at' => CarbonImmutable::parse('2026-01-01'),
        'current_period_start' => CarbonImmutable::parse('2026-01-01'),
        'current_period_end' => CarbonImmutable::parse('2026-02-01'),
    ]);

    $paymentAt = CarbonImmutable::parse('2026-03-01');

    // Ada: trial ended 2025-06-01 + 6m = 2025-12-01 → out of window
    expect($service->generateCommission($ada, makePayment($estate, 100000, $paymentAt)))->toBeNull();

    // Ben: trial ended 2026-01-01 + 6m = 2026-07-01 → still in window
    expect($service->generateCommission($ben, makePayment($estate, 100000, $paymentAt)))->not->toBeNull();
});

it('clones partner commission_length onto the plan including always', function () {
    $six = Partner::factory()->create(['commission_length' => 6]);
    $always = Partner::factory()->create(['commission_length' => null]);

    $planSix = CommissionPlan::cloneFromPartner($six);
    $planAlways = CommissionPlan::cloneFromPartner($always);

    expect($planSix->duration_months)->toBe(6)
        ->and($planAlways->duration_months)->toBeNull()
        ->and($planAlways->isAlwaysEligible())->toBeTrue();
});

it('sets open estate commission window when attributing a partner', function () {
    $partner = Partner::factory()->create(['commission_length' => 24]);
    $estate = Estate::factory()->create([
        'partner_id' => null,
        'commission_plan_id' => null,
    ]);

    $result = app(PartnerAttributionService::class)
        ->applyPartnerAttribution($estate, $partner);

    expect($result->commission_ends_at)->toBeNull()
        ->and($result->commissionPlan?->duration_months)->toBe(24)
        ->and($result->commission_status)->toBe(CommissionStatus::Active);
});
