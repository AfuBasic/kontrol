<?php

use App\Jobs\GenerateMonthlyPartnerEarningsJob;
use App\Models\CommissionableRevenue;
use App\Models\Partner;
use App\Models\PartnerEarning;
use App\Models\User;
use App\Notifications\Partner\EarningSettledNotification;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

function zeusSession(): void
{
    session()->put(config('zeus.session_key'), true);
}

function partnerWithMember(array $partnerAttrs = []): array
{
    $partner = Partner::factory()->create($partnerAttrs);
    $member = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    return [$partner, $member];
}

describe('GenerateMonthlyPartnerEarningsJob settlement lifecycle', function () {
    it('close mode sets settled_at null and revenues aggregated', function () {
        $partner = Partner::factory()->create();
        $month = CarbonImmutable::parse('2026-06-01');

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 4000,
            'revenue_amount' => 40000,
            'status' => 'pending',
            'created_at' => $month->addDays(4),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($month, GenerateMonthlyPartnerEarningsJob::MODE_CLOSE))->handle();

        $earning = PartnerEarning::query()
            ->where('partner_id', $partner->id)
            ->whereDate('month', '2026-06-01')
            ->firstOrFail();

        expect($earning->settled_at)->toBeNull()
            ->and($earning->total_amount)->toBe(4000);

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'aggregated')->count()
        )->toBe(1);
    });

    it('snapshot mode leaves revenues pending and upserts earning', function () {
        $partner = Partner::factory()->create();
        $month = CarbonImmutable::parse('2026-07-01');

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 1500,
            'revenue_amount' => 15000,
            'status' => 'pending',
            'created_at' => $month->addDays(1),
        ]);

        (new GenerateMonthlyPartnerEarningsJob($month, GenerateMonthlyPartnerEarningsJob::MODE_SNAPSHOT))->handle();

        $earning = PartnerEarning::query()
            ->where('partner_id', $partner->id)
            ->whereDate('month', '2026-07-01')
            ->firstOrFail();

        expect($earning->settled_at)->toBeNull()
            ->and($earning->total_amount)->toBe(1500);

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'pending')->count()
        )->toBe(1);
    });
});

describe('SettlementsController', function () {
    it('renders the settlements index for zeus', function () {
        zeusSession();

        $this->get(route('zeus.settlements.index'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Zeus/Settlements/Index')
                ->has('summary')
                ->has('earnings')
                ->has('filters'));
    });

    it('marks an earning as paid and settles linked revenues', function () {
        Notification::fake();
        [$partner, $member] = partnerWithMember();
        $admin = User::factory()->create();

        $month = CarbonImmutable::parse('2026-05-01');

        $earning = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => '2026-05-01',
            'total_amount' => 5000,
            'revenue_amount' => 50000,
            'settled_at' => null,
        ]);

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 5000,
            'revenue_amount' => 50000,
            'status' => 'aggregated',
            'created_at' => $month->addDays(5),
        ]);

        zeusSession();
        $this->actingAs($admin)
            ->post(route('zeus.settlements.pay', $earning), [
                'payment_reference' => 'TRX-12345678',
                'payment_note' => 'Bank transfer',
            ])
            ->assertRedirect(route('zeus.settlements.index'))
            ->assertSessionHas('success');

        $earning->refresh();

        expect($earning->settled_at)->not->toBeNull()
            ->and($earning->payment_reference)->toBe('TRX-12345678')
            ->and($earning->payment_note)->toBe('Bank transfer')
            ->and($earning->settled_by_user_id)->toBe($admin->id);

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'settled')->count()
        )->toBe(1);

        Notification::assertSentTo($member, EarningSettledNotification::class);
    });

    it('rejects re-settling an already paid earning', function () {
        $partner = Partner::factory()->create();
        $admin = User::factory()->create();

        $earning = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => '2026-04-01',
            'total_amount' => 3000,
            'revenue_amount' => 30000,
            'settled_at' => now(),
            'payment_reference' => 'ALREADY',
        ]);

        zeusSession();
        $this->actingAs($admin)
            ->postJson(route('zeus.settlements.pay', $earning), [
                'payment_reference' => 'NEW-REF',
            ])
            ->assertStatus(409)
            ->assertJsonValidationErrors(['earning']);
    });

    it('bulk pays multiple unsettled earnings', function () {
        Notification::fake();
        [$partner, $member] = partnerWithMember();
        $admin = User::factory()->create();

        $e1 = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => '2026-03-01',
            'total_amount' => 1000,
            'revenue_amount' => 10000,
            'settled_at' => null,
        ]);
        $e2 = PartnerEarning::create([
            'partner_id' => $partner->id,
            'month' => '2026-04-01',
            'total_amount' => 2000,
            'revenue_amount' => 20000,
            'settled_at' => null,
        ]);

        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 1000,
            'revenue_amount' => 10000,
            'status' => 'aggregated',
            'created_at' => CarbonImmutable::parse('2026-03-10'),
        ]);
        CommissionableRevenue::factory()->create([
            'partner_id' => $partner->id,
            'commission_amount' => 2000,
            'revenue_amount' => 20000,
            'status' => 'aggregated',
            'created_at' => CarbonImmutable::parse('2026-04-10'),
        ]);

        zeusSession();
        $this->actingAs($admin)
            ->post(route('zeus.settlements.bulk-pay'), [
                'earning_ids' => [$e1->id, $e2->id],
                'payment_reference' => 'BULK-REF-99',
                'payment_note' => 'Q1+Q2 batch',
            ])
            ->assertRedirect(route('zeus.settlements.index'))
            ->assertSessionHas('success');

        expect($e1->fresh()->settled_at)->not->toBeNull()
            ->and($e2->fresh()->settled_at)->not->toBeNull()
            ->and($e1->fresh()->payment_reference)->toBe('BULK-REF-99');

        expect(
            CommissionableRevenue::where('partner_id', $partner->id)->where('status', 'settled')->count()
        )->toBe(2);

        Notification::assertSentTo($member, EarningSettledNotification::class);
    });

    it('dispatches snapshot job for the current month by default', function () {
        Queue::fake();
        zeusSession();

        $this->post(route('zeus.earnings.snapshot'))
            ->assertRedirect(route('zeus.settlements.index'))
            ->assertSessionHas('success');

        Queue::assertPushed(GenerateMonthlyPartnerEarningsJob::class, function (GenerateMonthlyPartnerEarningsJob $job) {
            $expected = CarbonImmutable::now()->startOfMonth()->format('Y-m-01');

            return $job->mode === GenerateMonthlyPartnerEarningsJob::MODE_SNAPSHOT
                && $job->forMonth !== null
                && $job->forMonth->format('Y-m-01') === $expected;
        });
    });

    it('dispatches snapshot for a specified month and mode', function () {
        Queue::fake();
        zeusSession();

        $this->post(route('zeus.earnings.snapshot'), [
            'month' => '2026-06-01',
            'mode' => GenerateMonthlyPartnerEarningsJob::MODE_CLOSE,
        ])->assertRedirect(route('zeus.settlements.index'));

        Queue::assertPushed(GenerateMonthlyPartnerEarningsJob::class, function (GenerateMonthlyPartnerEarningsJob $job) {
            return $job->mode === GenerateMonthlyPartnerEarningsJob::MODE_CLOSE
                && $job->forMonth?->format('Y-m-01') === '2026-06-01';
        });
    });
});
