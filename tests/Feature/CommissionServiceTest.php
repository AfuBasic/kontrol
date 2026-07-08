<?php

use App\Enums\CommissionStatus;
use App\Models\CommissionPlan;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\Commission\CommissionService;

it('determines commission eligibility based on partner assignment and commission window', function () {
    $partner = Partner::factory()->create();
    $commissionPlan = CommissionPlan::factory()->create([
        'source_partner_id' => $partner->id,
        'commission_rate' => 10,
    ]);

    $eligibleEstate = Estate::factory()->create([
        'partner_id' => $partner->id,
        'commission_plan_id' => $commissionPlan->id,
        'commission_status' => CommissionStatus::Active,
        'commission_starts_at' => now()->subDay(),
        'commission_ends_at' => now()->addMonth(),
    ]);

    $inactiveEstate = Estate::factory()->create([
        'partner_id' => $partner->id,
        'commission_plan_id' => $commissionPlan->id,
        'commission_status' => CommissionStatus::Inactive,
        'commission_starts_at' => now()->subDay(),
        'commission_ends_at' => now()->addMonth(),
    ]);

    $expiredEstate = Estate::factory()->create([
        'partner_id' => $partner->id,
        'commission_plan_id' => $commissionPlan->id,
        'commission_status' => CommissionStatus::Active,
        'commission_starts_at' => now()->subMonths(2),
        'commission_ends_at' => now()->subDay(),
    ]);

    $service = app(CommissionService::class);

    expect($service->eligibleForCommission($eligibleEstate))->toBeTrue()
        ->and($service->eligibleForCommission($inactiveEstate))->toBeFalse()
        ->and($service->eligibleForCommission($expiredEstate))->toBeFalse();
});

it('generates commissionable revenue only within the active commission window', function () {
    $partner = Partner::factory()->create();
    $commissionPlan = CommissionPlan::factory()->create([
        'source_partner_id' => $partner->id,
        'commission_rate' => 20,
    ]);

    $estate = Estate::factory()->create([
        'partner_id' => $partner->id,
        'commission_plan_id' => $commissionPlan->id,
        'commission_status' => CommissionStatus::Active,
        'commission_starts_at' => now()->subDay(),
        'commission_ends_at' => now()->addMonth(),
    ]);

    $resident = User::factory()->create();
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $transaction = PaymentTransaction::create([
        'estate_id' => $estate->id,
        'paystack_reference' => 'ref_commission_test',
        'idempotency_key' => 'idem_commission_test',
        'amount' => 100000,
        'currency' => 'NGN',
        'status' => 'success',
    ]);

    $service = app(CommissionService::class);
    $revenue = $service->generateCommission($resident, $transaction);

    expect($revenue)->not->toBeNull()
        ->and($revenue->commission_amount)->toBe(20000)
        ->and($revenue->revenue_amount)->toBe(100000)
        ->and($revenue->partner_id)->toBe($partner->id);

    $estate->update(['commission_ends_at' => now()->subDay()]);

    $secondTransaction = PaymentTransaction::create([
        'estate_id' => $estate->id,
        'paystack_reference' => 'ref_commission_test_2',
        'idempotency_key' => 'idem_commission_test_2',
        'amount' => 50000,
        'currency' => 'NGN',
        'status' => 'success',
    ]);

    expect($service->generateCommission($resident, $secondTransaction))->toBeNull();
});
