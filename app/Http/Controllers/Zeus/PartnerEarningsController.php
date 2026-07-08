<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateMonthlyPartnerEarningsJob;
use App\Models\Partner;
use App\Models\PartnerEarning;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnerEarningsController extends Controller
{
    /**
     * Show monthly earnings for a specific partner.
     */
    public function index(Partner $partner): Response
    {
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

        $summary = [
            'total_earned' => $partner->earnings()->sum('total_amount'),
            'pending_commissions' => $partner->commissionableRevenues()
                ->where('status', 'pending')
                ->sum('commission_amount'),
            'next_settlement_date' => CarbonImmutable::now()->addMonthNoOverflow()->startOfMonth()->format('Y-m-d'),
        ];

        return Inertia::render('Zeus/Partners/Earnings', [
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'commission_type' => $partner->commission_type,
                'commission_rate' => $partner->commission_rate,
                'status' => $partner->status,
            ],
            'earnings' => $earnings,
            'summary' => $summary,
        ]);
    }

    /**
     * Manually trigger settlement for a specific month.
     */
    public function settle(Request $request, Partner $partner): RedirectResponse
    {
        $request->validate([
            'month' => ['required', 'date_format:Y-m-d'],
        ]);

        $month = CarbonImmutable::parse($request->month)->startOfMonth();

        GenerateMonthlyPartnerEarningsJob::dispatch($month);

        return redirect()
            ->route('zeus.partners.earnings.index', $partner)
            ->with('success', "Settlement job queued for {$month->format('F Y')}.");
    }
}
