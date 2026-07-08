<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = Auth::user();
        $partner = $user->partner;

        $totalEarned = 0;
        $pendingCommissions = 0;
        $partnerRequestCount = 0;
        $commissionRate = null;
        $commissionType = null;

        if ($partner) {
            $totalEarned = $partner->earnings()->sum('total_amount');

            $pendingCommissions = $partner->commissionableRevenues()
                ->where('status', 'pending')
                ->sum('commission_amount');

            $partnerRequestCount = $partner->partnerRequests()->count();
            $commissionRate = $partner->commission_rate;
            $commissionType = $partner->commission_type;
        }

        $nextSettlementDate = CarbonImmutable::now()
            ->addMonthNoOverflow()
            ->startOfMonth()
            ->format('F j, Y');

        return Inertia::render('Partner/Dashboard', [
            'user' => [
                'id' => $user->id,
                'ulid' => $user->ulid,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'stats' => [
                'total_earned' => $totalEarned,
                'pending_commissions' => $pendingCommissions,
                'partner_request_count' => $partnerRequestCount,
                'commission_rate' => $commissionRate,
                'commission_type' => $commissionType,
                'commission_length' => $partner ? $partner->commission_length : null,
                'next_settlement_date' => $nextSettlementDate,
            ],
        ]);
    }
}
