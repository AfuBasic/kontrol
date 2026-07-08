<?php

use App\Jobs\GenerateMonthlyPartnerEarningsJob;
use App\Models\CommissionableRevenue;
use App\Models\Partner;
use App\Models\PartnerEarning;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

describe('GenerateMonthlyPartnerEarningsJob', function () {
    it('aggregates pending commissions into a partner_earnings record', function () {
        $partner = Partner::factory()->create(['commission_type' => 'percentage', 'commission_rate' => 10]);

        $targetMonth = CarbonImmutable::parse('2026-06-01');

        // Create two pending commission records within that month
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

        (new GenerateMonthlyPartnerEarningsJob($targetMonth))->handle();

        $earning = PartnerEarning::where('partner_id', $partner->id)
            ->whereDate('month', '2026-06-01')
            ->firstOrFail();

        expect($earning->total_amount)->toBe(8000);
        expect($earning->revenue_amount)->toBe(80000);
        expect($earning->settled_at)->not->toBeNull();
    });

    it('marks settled commissions with status settled', function () {
        $partner = Partner::factory()->create();

        $targetMonth = CarbonImmutable::parse('2026-06-01');

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 1000,
            'revenue_amount' => 10000,
            'status' => 'pending',
            'created_at' => $targetMonth->addDays(3),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($targetMonth))->handle();

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'pending')->count()
        )->toBe(0);

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'settled')->count()
        )->toBe(1);
    });

    it('does not settle commissions from a different month', function () {
        $partner = Partner::factory()->create();

        $targetMonth = CarbonImmutable::parse('2026-06-01');

        // Commission from a different month
        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 2000,
            'revenue_amount' => 20000,
            'status' => 'pending',
            'created_at' => CarbonImmutable::parse('2026-07-10'),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($targetMonth))->handle();

        // Should NOT be settled
        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'pending')->count()
        )->toBe(1);
    });

    it('can be dispatched to the queue', function () {
        Queue::fake();

        GenerateMonthlyPartnerEarningsJob::dispatch(CarbonImmutable::parse('2026-06-01'));

        Queue::assertPushed(GenerateMonthlyPartnerEarningsJob::class);
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
    });
});
