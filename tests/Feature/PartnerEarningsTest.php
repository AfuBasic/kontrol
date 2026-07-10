<?php

use App\Jobs\GenerateMonthlyPartnerEarningsJob;
use App\Models\CommissionableRevenue;
use App\Models\Partner;
use App\Models\PartnerEarning;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

describe('GenerateMonthlyPartnerEarningsJob close mode', function () {
    it('aggregates pending commissions without auto-setting settled_at', function () {
        $partner = Partner::factory()->create(['commission_type' => 'percentage', 'commission_rate' => 10]);

        $targetMonth = CarbonImmutable::parse('2026-06-01');

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 5000,
            'revenue_amount' => 50000,
            'status' => 'pending',
            'created_at' => $targetMonth->addDays(5),
        ]);

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 3000,
            'revenue_amount' => 30000,
            'status' => 'pending',
            'created_at' => $targetMonth->addDays(15),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($targetMonth, GenerateMonthlyPartnerEarningsJob::MODE_CLOSE))->handle();

        $earning = PartnerEarning::where('partner_id', $partner->id)
            ->whereDate('month', '2026-06-01')
            ->firstOrFail();

        expect($earning->total_amount)->toBe(8000);
        expect($earning->revenue_amount)->toBe(80000);
        expect($earning->settled_at)->toBeNull();
    });

    it('locks revenues as aggregated in close mode', function () {
        $partner = Partner::factory()->create();

        $targetMonth = CarbonImmutable::parse('2026-06-01');

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 1000,
            'revenue_amount' => 10000,
            'status' => 'pending',
            'created_at' => $targetMonth->addDays(3),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($targetMonth, GenerateMonthlyPartnerEarningsJob::MODE_CLOSE))->handle();

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'pending')->count()
        )->toBe(0);

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'aggregated')->count()
        )->toBe(1);

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'settled')->count()
        )->toBe(0);
    });

    it('does not aggregate commissions from a different month', function () {
        $partner = Partner::factory()->create();

        $targetMonth = CarbonImmutable::parse('2026-06-01');

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 2000,
            'revenue_amount' => 20000,
            'status' => 'pending',
            'created_at' => CarbonImmutable::parse('2026-07-10'),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($targetMonth, GenerateMonthlyPartnerEarningsJob::MODE_CLOSE))->handle();

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'pending')->count()
        )->toBe(1);
    });

    it('can be dispatched to the queue', function () {
        Queue::fake();

        GenerateMonthlyPartnerEarningsJob::dispatch(
            CarbonImmutable::parse('2026-06-01'),
            GenerateMonthlyPartnerEarningsJob::MODE_CLOSE,
        );

        Queue::assertPushed(GenerateMonthlyPartnerEarningsJob::class);
    });
});

describe('GenerateMonthlyPartnerEarningsJob snapshot mode', function () {
    it('upserts earning while leaving revenues pending', function () {
        $partner = Partner::factory()->create();
        $targetMonth = CarbonImmutable::parse('2026-07-01');

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 2500,
            'revenue_amount' => 25000,
            'status' => 'pending',
            'created_at' => $targetMonth->addDays(2),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($targetMonth, GenerateMonthlyPartnerEarningsJob::MODE_SNAPSHOT))->handle();

        $earning = PartnerEarning::where('partner_id', $partner->id)
            ->whereDate('month', '2026-07-01')
            ->firstOrFail();

        expect($earning->total_amount)->toBe(2500)
            ->and($earning->settled_at)->toBeNull();

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'pending')->count()
        )->toBe(1);

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'aggregated')->count()
        )->toBe(0);
    });

    it('does not overwrite a paid period', function () {
        $partner = Partner::factory()->create();
        $targetMonth = CarbonImmutable::parse('2026-05-01');

        PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => '2026-05-01',
            'total_amount' => 9000,
            'revenue_amount' => 90000,
            'settled_at' => now(),
            'payment_reference' => 'PAID-1',
        ]);

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 100,
            'revenue_amount' => 1000,
            'status' => 'pending',
            'created_at' => $targetMonth->addDays(1),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($targetMonth, GenerateMonthlyPartnerEarningsJob::MODE_SNAPSHOT))->handle();

        $earning = PartnerEarning::where('partner_id', $partner->id)
            ->whereDate('month', '2026-05-01')
            ->firstOrFail();

        expect($earning->total_amount)->toBe(9000)
            ->and($earning->payment_reference)->toBe('PAID-1')
            ->and($earning->settled_at)->not->toBeNull();
    });
});

describe('PartnerEarning model', function () {
    it('marks settled correctly', function () {
        $partner = Partner::factory()->create();

        $settled = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => '2026-05-01',
            'total_amount' => 5000,
            'revenue_amount' => 50000,
            'settled_at' => now(),
        ]);

        $unsettled = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => '2026-06-01',
            'total_amount' => 0,
            'revenue_amount' => 0,
            'settled_at' => null,
        ]);

        expect($settled->isSettled())->toBeTrue();
        expect($unsettled->isSettled())->toBeFalse();
        expect($unsettled->isPendingSettlement())->toBeTrue();
    });

    it('detects accruing for current month', function () {
        $partner = Partner::factory()->create();
        $now = CarbonImmutable::now()->startOfMonth();

        $current = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => $now->toDateString(),
            'total_amount' => 1000,
            'revenue_amount' => 10000,
            'settled_at' => null,
        ]);

        $previous = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => $now->subMonthNoOverflow()->toDateString(),
            'total_amount' => 2000,
            'revenue_amount' => 20000,
            'settled_at' => null,
        ]);

        expect($current->isAccruing())->toBeTrue()
            ->and($current->statusKey())->toBe('accruing')
            ->and($previous->isAccruing())->toBeFalse()
            ->and($previous->statusKey())->toBe('pending');
    });
});
