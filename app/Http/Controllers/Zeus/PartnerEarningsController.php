<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerEarning;
use Carbon\CarbonImmutable;
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
                'is_pending' => $earning->isPendingSettlement() && ! $earning->isAccruing(),
                'is_accruing' => $earning->isAccruing(),
                'status' => $earning->statusKey(),
                'status_label' => $earning->statusLabel(),
                'payment_reference_masked' => $earning->maskedPaymentReference(),
            ]);

        $summary = [
            'total_earned' => (int) $partner->earnings()->whereNotNull('settled_at')->sum('total_amount'),
            'pending_commissions' => (int) $partner->earnings()->whereNull('settled_at')->sum('total_amount'),
            'pending_revenues' => (int) $partner->commissionableRevenues()
                ->whereIn('status', ['pending', 'aggregated'])
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
}
