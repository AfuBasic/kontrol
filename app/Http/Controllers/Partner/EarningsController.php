<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\PartnerEarning;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EarningsController extends Controller
{
    public function __invoke(): Response
    {
        $user = Auth::user();
        $partner = $user->partner;

        $nextSettlement = CarbonImmutable::now()
            ->addMonthNoOverflow()
            ->startOfMonth();

        $empty = [
            'earnings' => [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'prev_page_url' => null,
                'next_page_url' => null,
                'links' => [],
            ],
            'summary' => [
                'total_earned' => 0,
                'pending_commissions' => 0,
                'current_month_earnings' => 0,
                'previous_month_earnings' => 0,
                'month_over_month_change' => null,
                'projected_settlement' => 0,
                'next_settlement_date' => $nextSettlement->format('F j, Y'),
                'next_settlement_iso' => $nextSettlement->toDateString(),
                'days_until_settlement' => max(0, (int) CarbonImmutable::now()->startOfDay()->diffInDays($nextSettlement, false)),
            ],
            'chart' => [],
            'timeline' => [],
        ];

        if (! $partner) {
            return Inertia::render('Partner/Earnings', $empty);
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
                'is_settled' => $earning->isSettled(),
            ]);

        $pendingCommissions = (int) $partner->commissionableRevenues()
            ->where('status', 'pending')
            ->sum('commission_amount');

        $currentMonthStart = CarbonImmutable::now()->startOfMonth();
        $previousMonthStart = $currentMonthStart->subMonthNoOverflow();

        $currentMonthEarnings = (int) $partner->earnings()
            ->whereDate('month', $currentMonthStart->toDateString())
            ->sum('total_amount');

        if ($currentMonthEarnings === 0) {
            $currentMonthEarnings = (int) $partner->commissionableRevenues()
                ->where('status', 'pending')
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
            ])
            ->values()
            ->all();

        return Inertia::render('Partner/Earnings', [
            'earnings' => $earnings,
            'summary' => [
                'total_earned' => (int) $partner->earnings()->sum('total_amount'),
                'pending_commissions' => $pendingCommissions,
                'current_month_earnings' => $currentMonthEarnings,
                'previous_month_earnings' => $previousMonthEarnings,
                'month_over_month_change' => $monthOverMonth,
                'projected_settlement' => $pendingCommissions,
                'next_settlement_date' => $nextSettlement->format('F j, Y'),
                'next_settlement_iso' => $nextSettlement->toDateString(),
                'days_until_settlement' => max(0, (int) CarbonImmutable::now()->startOfDay()->diffInDays($nextSettlement, false)),
            ],
            'chart' => $chart,
            'timeline' => $timeline,
        ]);
    }
}
