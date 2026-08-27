<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\CommissionableRevenue;
use App\Models\Estate;
use App\Models\EstateApplication;
use App\Models\PartnerEarning;
use App\Services\Zeus\SettlementInboxService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EarningsController extends Controller
{
    public function __construct(
        private SettlementInboxService $settlementInbox,
    ) {}

    public function __invoke(): Response
    {
        $this->settlementInbox->hydrateOpenPeriods();

        $user = Auth::user();
        $partner = $user->partner;

        $nextSettlement = CarbonImmutable::now()
            ->addMonthNoOverflow()
            ->startOfMonth();

        $daysUntil = max(0, (int) CarbonImmutable::now()->startOfDay()->diffInDays($nextSettlement, false));
        $daysInCycle = max(1, (int) CarbonImmutable::now()->startOfMonth()->diffInDays($nextSettlement, false));
        $settlementProgress = (int) min(100, max(0, round((1 - ($daysUntil / $daysInCycle)) * 100)));

        $emptySummary = [
            'total_earned' => 0,
            'pending_commissions' => 0,
            'current_month_earnings' => 0,
            'previous_month_earnings' => 0,
            'month_over_month_change' => null,
            'projected_settlement' => 0,
            'next_settlement_date' => $nextSettlement->format('F j, Y'),
            'next_settlement_iso' => $nextSettlement->toDateString(),
            'next_settlement_month' => $nextSettlement->format('F Y'),
            'days_until_settlement' => $daysUntil,
            'settlement_progress' => $settlementProgress,
            'commission_rate' => null,
            'commission_type' => null,
            'commission_length' => null,
            'eligible_payment_count' => 0,
        ];

        if (! $partner) {
            return Inertia::render('Partner/Earnings', [
                'earnings' => $this->emptyPagination(),
                'summary' => $emptySummary,
                'chart' => [],
                'timeline' => [],
                'topEstates' => [],
                'pipeline' => [
                    'submitted' => 0,
                    'accepted' => 0,
                    'rejected' => 0,
                    'live_estates' => 0,
                ],
                'attention' => [],
                'checklist' => $this->checklist(false, false, 0, 0),
            ]);
        }

        $earnings = $partner->earnings()
            ->orderByDesc('month')
            ->paginate(24)
            ->through(fn (PartnerEarning $earning) => [
                'id' => $earning->id,
                'month' => $earning->month->format('Y-m-01'),
                'month_label' => $earning->month->format('F Y'),
                'total_amount' => $earning->total_amount,
                'revenue_amount' => $earning->revenue_amount,
                'settled_at' => $earning->settled_at?->toDateTimeString(),
                'settled_at_human' => $earning->settled_at?->format('M j, Y'),
                'is_settled' => $earning->isSettled(),
                'is_pending' => $earning->isPendingSettlement() && ! $earning->isAccruing(),
                'is_accruing' => $earning->isAccruing(),
                'status' => $earning->statusKey(),
                'status_label' => $earning->statusLabel(),
                'payment_reference_masked' => $earning->maskedPaymentReference(),
            ]);

        $pendingCommissions = (int) $partner->earnings()
            ->whereNull('settled_at')
            ->sum('total_amount');

        $unsettledRevenueCommission = (int) $partner->commissionableRevenues()
            ->whereIn('status', ['pending', 'aggregated'])
            ->sum('commission_amount');

        // Prefer snapshotted unsettled earnings; fall back to live revenues if no earning rows yet.
        if ($pendingCommissions === 0 && $unsettledRevenueCommission > 0) {
            $pendingCommissions = $unsettledRevenueCommission;
        }

        $eligiblePaymentCount = (int) $partner->commissionableRevenues()
            ->whereIn('status', ['pending', 'aggregated'])
            ->count();

        $currentMonthStart = CarbonImmutable::now()->startOfMonth();
        $previousMonthStart = $currentMonthStart->subMonthNoOverflow();

        $currentMonthEarnings = (int) $partner->earnings()
            ->whereDate('month', $currentMonthStart->toDateString())
            ->sum('total_amount');

        if ($currentMonthEarnings === 0) {
            $currentMonthEarnings = (int) $partner->commissionableRevenues()
                ->whereIn('status', ['pending', 'aggregated'])
                ->where('created_at', '>=', $currentMonthStart)
                ->sum('commission_amount');
        }

        $previousMonthEarnings = (int) $partner->earnings()
            ->whereDate('month', $previousMonthStart->toDateString())
            ->sum('total_amount');

        $monthOverMonth = null;
        if ($previousMonthEarnings > 0) {
            $monthOverMonth = round((($currentMonthEarnings - $previousMonthEarnings) / $previousMonthEarnings) * 100, 1);
        } elseif ($currentMonthEarnings > 0) {
            $monthOverMonth = 100.0;
        }

        $chart = $partner->earnings()
            ->orderBy('month')
            ->limit(12)
            ->get()
            ->map(fn (PartnerEarning $earning) => [
                'month' => $earning->month->format('Y-m'),
                'label' => $earning->month->format('M Y'),
                'total_amount' => $earning->total_amount,
                'revenue_amount' => $earning->revenue_amount,
            ])
            ->values()
            ->all();

        $timeline = $partner->earnings()
            ->orderByDesc('month')
            ->limit(6)
            ->get()
            ->map(fn (PartnerEarning $earning) => [
                'id' => $earning->id,
                'label' => $earning->month->format('F Y'),
                'amount' => $earning->total_amount,
                'settled_at' => $earning->settled_at?->format('M j, Y'),
                'is_settled' => $earning->isSettled(),
                'status' => $earning->statusKey(),
                'status_label' => $earning->statusLabel(),
                'payment_reference_masked' => $earning->maskedPaymentReference(),
            ])
            ->values()
            ->all();

        $topEstates = $this->topEstates($partner->id);
        $pipeline = $this->pipelineStats($partner->id);
        $attention = $this->attentionItems($partner->id, $pendingCommissions, $pipeline);
        $hasBank = $partner->hasVerifiedBankAccount();
        $hasLive = $pipeline['live_estates'] > 0;

        return Inertia::render('Partner/Earnings', [
            'earnings' => $earnings,
            'summary' => [
                'total_earned' => (int) $partner->earnings()->whereNotNull('settled_at')->sum('total_amount'),
                'pending_commissions' => $pendingCommissions,
                'current_month_earnings' => $currentMonthEarnings,
                'previous_month_earnings' => $previousMonthEarnings,
                'month_over_month_change' => $monthOverMonth,
                'projected_settlement' => $pendingCommissions,
                'next_settlement_date' => $nextSettlement->format('F j, Y'),
                'next_settlement_iso' => $nextSettlement->toDateString(),
                'next_settlement_month' => $nextSettlement->format('F Y'),
                'days_until_settlement' => $daysUntil,
                'settlement_progress' => $settlementProgress,
                'commission_rate' => $partner->commission_rate !== null ? (string) $partner->commission_rate : null,
                'commission_type' => $partner->commission_type,
                'commission_length' => $partner->commission_length,
                'eligible_payment_count' => $eligiblePaymentCount,
            ],
            'chart' => $chart,
            'timeline' => $timeline,
            'topEstates' => $topEstates,
            'pipeline' => $pipeline,
            'attention' => $attention,
            'checklist' => $this->checklist($hasBank, $hasLive, $pipeline['submitted'] + $pipeline['accepted'], $pendingCommissions),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPagination(): array
    {
        return [
            'data' => [],
            'current_page' => 1,
            'last_page' => 1,
            'total' => 0,
            'prev_page_url' => null,
            'next_page_url' => null,
            'links' => [],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function topEstates(int $partnerId): array
    {
        return CommissionableRevenue::query()
            ->where('partner_id', $partnerId)
            ->select([
                'estate_id',
                DB::raw('SUM(revenue_amount) as revenue_amount'),
                DB::raw('SUM(commission_amount) as commission_amount'),
                DB::raw('COUNT(*) as payment_count'),
                DB::raw("SUM(CASE WHEN status IN ('pending', 'aggregated') THEN 1 ELSE 0 END) as pending_count"),
            ])
            ->groupBy('estate_id')
            ->orderByDesc('commission_amount')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $estate = $row->estate_id
                    ? Estate::query()->select(['id', 'name', 'ulid', 'status'])->find($row->estate_id)
                    : null;

                return [
                    'estate_id' => $row->estate_id,
                    'estate_name' => $estate?->name ?? 'Unknown estate',
                    'estate_ulid' => $estate?->ulid,
                    'estate_status' => $estate?->status,
                    'payment_count' => (int) $row->payment_count,
                    'revenue_amount' => (int) $row->revenue_amount,
                    'commission_amount' => (int) $row->commission_amount,
                    'has_pending' => (int) $row->pending_count > 0,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{submitted: int, accepted: int, rejected: int, live_estates: int}
     */
    private function pipelineStats(int $partnerId): array
    {
        $apps = EstateApplication::query()->where('partner_id', $partnerId)->get();

        return [
            'submitted' => $apps->filter(fn (EstateApplication $a) => $a->partnerStatusKey() === 'submitted')->count(),
            'accepted' => $apps->filter(fn (EstateApplication $a) => $a->partnerStatusKey() === 'accepted')->count(),
            'rejected' => $apps->filter(fn (EstateApplication $a) => $a->partnerStatusKey() === 'rejected')->count(),
            'live_estates' => Estate::query()->where('partner_id', $partnerId)->count(),
        ];
    }

    /**
     * @param  array{submitted: int, accepted: int, rejected: int, live_estates: int}  $pipeline
     * @return list<array{key: string, title: string, description: string, href: string, cta: string}>
     */
    private function attentionItems(int $partnerId, int $pendingCommissions, array $pipeline): array
    {
        $items = [];

        if ($pipeline['submitted'] > 0) {
            $items[] = [
                'key' => 'reviews',
                'title' => $pipeline['submitted'].' estate'.($pipeline['submitted'] === 1 ? '' : 's').' awaiting review',
                'description' => 'Kontrol is reviewing your referral'.($pipeline['submitted'] === 1 ? '' : 's').'.',
                'href' => '/partner/partner-requests?status=submitted',
                'cta' => 'View pipeline',
            ];
        }

        if ($pipeline['live_estates'] === 0 && ($pipeline['submitted'] + $pipeline['accepted']) === 0) {
            $items[] = [
                'key' => 'submit',
                'title' => 'Submit your first estate',
                'description' => 'Commissions start when referred estates activate and residents pay.',
                'href' => '/partner/partner-requests/create',
                'cta' => 'Submit estate',
            ];
        }

        if ($pendingCommissions === 0 && $pipeline['live_estates'] > 0) {
            $items[] = [
                'key' => 'grow',
                'title' => 'Grow resident adoption',
                'description' => 'You have live estates - commissions appear as residents subscribe.',
                'href' => '/partner/partner-requests',
                'cta' => 'Open My Estates',
            ];
        }

        if ($pendingCommissions > 0) {
            $items[] = [
                'key' => 'settlement',
                'title' => 'Settlement in progress',
                'description' => 'Pending commissions will settle at the start of next month.',
                'href' => '/partner/earnings',
                'cta' => 'View settlement',
            ];
        }

        return $items;
    }

    /**
     * @return list<array{key: string, label: string, done: bool, href: string|null}>
     */
    private function checklist(bool $hasBank, bool $hasLive, int $pipelineTotal, int $pending): array
    {
        return [
            [
                'key' => 'submit',
                'label' => 'Submit an estate referral',
                'done' => $pipelineTotal > 0 || $hasLive,
                'href' => '/partner/partner-requests/create',
            ],
            [
                'key' => 'accept',
                'label' => 'Get an estate accepted & activated',
                'done' => $hasLive,
                'href' => '/partner/partner-requests',
            ],
            [
                'key' => 'bank',
                'label' => 'Add payout bank details',
                'done' => $hasBank,
                'href' => '/partner/profile?tab=banking',
            ],
            [
                'key' => 'earn',
                'label' => 'Earn first commission',
                'done' => $pending > 0,
                'href' => null,
            ],
        ];
    }
}
