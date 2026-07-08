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

        if (! $partner) {
            return Inertia::render('Partner/Earnings', [
                'earnings' => [],
                'summary' => [
                    'total_earned' => 0,
                    'pending_commissions' => 0,
                    'next_settlement_date' => null,
                ],
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
                'is_settled' => $earning->isSettled(),
            ]);

        $pendingCommissions = $partner->commissionableRevenues()
            ->where('status', 'pending')
            ->sum('commission_amount');

        $summary = [
            'total_earned' => $partner->earnings()->sum('total_amount'),
            'pending_commissions' => $pendingCommissions,
            'next_settlement_date' => CarbonImmutable::now()->addMonthNoOverflow()->startOfMonth()->format('Y-m-d'),
        ];

        return Inertia::render('Partner/Earnings', [
            'earnings' => $earnings,
            'summary' => $summary,
        ]);
    }
}
