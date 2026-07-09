<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\EstateApplication;
use App\Models\PartnerEarning;
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
        $currentMonthEarnings = 0;
        $partnerRequestCount = 0;
        $approvedRequestCount = 0;
        $convertedEstates = 0;
        $commissionRate = null;
        $commissionType = null;
        $monthlyEarnings = [];
        $recentActivity = [];
        $actions = [];

        $nextSettlement = CarbonImmutable::now()
            ->addMonthNoOverflow()
            ->startOfMonth();

        if ($partner) {
            $totalEarned = (int) $partner->earnings()->sum('total_amount');

            $pendingCommissions = (int) $partner->commissionableRevenues()
                ->where('status', 'pending')
                ->sum('commission_amount');

            $currentMonthStart = CarbonImmutable::now()->startOfMonth();
            $currentMonthEarnings = (int) $partner->earnings()
                ->whereDate('month', $currentMonthStart->toDateString())
                ->sum('total_amount');

            // Pending commissions this calendar month also count as "current period"
            if ($currentMonthEarnings === 0) {
                $currentMonthEarnings = (int) $partner->commissionableRevenues()
                    ->where('status', 'pending')
                    ->where('created_at', '>=', $currentMonthStart)
                    ->sum('commission_amount');
            }

            $partnerRequestCount = $partner->estateApplications()->count();
            $approvedRequestCount = $partner->estateApplications()
                ->where('status', 'approved')
                ->count();
            $convertedEstates = $partner->estates()->count();
            $commissionRate = $partner->commission_rate;
            $commissionType = $partner->commission_type;

            $monthlyEarnings = $partner->earnings()
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

            $recentActivity = $partner->estateApplications()
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (EstateApplication $application) => [
                    'id' => $application->id,
                    'type' => 'partner_request',
                    'title' => $application->estate_name,
                    'status' => $application->partnerStatusKey(),
                    'status_label' => $application->partnerStatusLabel(),
                    'description' => match ($application->partnerStatusKey()) {
                        'submitted' => 'Estate request submitted',
                        'accepted' => $application->estate
                            ? 'Accepted — estate live on Kontrol'
                            : 'Estate accepted',
                        'rejected' => $application->rejection_reason
                            ? 'Rejected: '.$application->rejection_reason
                            : 'Request rejected',
                        default => 'Status updated',
                    },
                    'at' => $application->updated_at?->toIso8601String(),
                    'at_human' => $application->updated_at?->diffForHumans(),
                ])
                ->values()
                ->all();

            $draftInProgress = false; // client-side drafts; server has no draft status yet

            if ($partnerRequestCount === 0) {
                $actions[] = [
                    'key' => 'submit_estate',
                    'title' => 'Submit your first estate',
                    'description' => 'Start earning by referring an estate to Kontrol.',
                    'href' => '/partner/partner-requests/create',
                    'cta' => 'Submit estate',
                    'tone' => 'primary',
                ];
            } else {
                $actions[] = [
                    'key' => 'submit_another',
                    'title' => 'Grow your pipeline',
                    'description' => 'Submit another estate to increase future commissions.',
                    'href' => '/partner/partner-requests/create',
                    'cta' => 'Submit estate',
                    'tone' => 'primary',
                ];
            }

            if ($pendingCommissions > 0) {
                $actions[] = [
                    'key' => 'view_pending',
                    'title' => 'Pending commissions ready',
                    'description' => 'Review what will settle next month.',
                    'href' => '/partner/earnings',
                    'cta' => 'View earnings',
                    'tone' => 'success',
                ];
            }

            $infoRequested = $partner->estateApplications()
                ->where('status', 'info_requested')
                ->count();

            if ($infoRequested > 0) {
                $actions[] = [
                    'key' => 'info_requested',
                    'title' => "{$infoRequested} request".($infoRequested > 1 ? 's' : '').' need your reply',
                    'description' => 'Kontrol asked for more details on estate submissions.',
                    'href' => '/partner/partner-requests',
                    'cta' => 'Open pipeline',
                    'tone' => 'warning',
                ];
            }

            if ($draftInProgress) {
                $actions[] = [
                    'key' => 'continue_draft',
                    'title' => 'Continue draft estate',
                    'description' => 'You have an unfinished estate submission.',
                    'href' => '/partner/partner-requests/create',
                    'cta' => 'Continue',
                    'tone' => 'neutral',
                ];
            }
        } else {
            $actions[] = [
                'key' => 'contact_support',
                'title' => 'Partner organization not linked',
                'description' => 'Contact support so we can attach your partner account.',
                'href' => '/partner/support',
                'cta' => 'Get support',
                'tone' => 'warning',
            ];
        }

        $daysUntilSettlement = max(0, (int) CarbonImmutable::now()->startOfDay()->diffInDays($nextSettlement, false));

        $conversionRate = $partnerRequestCount > 0
            ? round(($convertedEstates / $partnerRequestCount) * 100, 1)
            : 0.0;

        return Inertia::render('Partner/Dashboard', [
            'user' => [
                'id' => $user->id,
                'ulid' => $user->ulid,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'partner' => $partner ? [
                'name' => $partner->name,
                'status' => $partner->status,
            ] : null,
            'stats' => [
                'total_earned' => $totalEarned,
                'pending_commissions' => $pendingCommissions,
                'current_month_earnings' => $currentMonthEarnings,
                'partner_request_count' => $partnerRequestCount,
                'approved_request_count' => $approvedRequestCount,
                'converted_estates' => $convertedEstates,
                'conversion_rate' => $conversionRate,
                'commission_rate' => $commissionRate,
                'commission_type' => $commissionType,
                'commission_length' => $partner?->commission_length,
                'next_settlement_date' => $nextSettlement->format('F j, Y'),
                'next_settlement_iso' => $nextSettlement->toDateString(),
                'days_until_settlement' => $daysUntilSettlement,
            ],
            'monthlyEarnings' => $monthlyEarnings,
            'recentActivity' => $recentActivity,
            'actions' => $actions,
        ]);
    }
}
