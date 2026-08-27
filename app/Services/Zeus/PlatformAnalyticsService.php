<?php

namespace App\Services\Zeus;

use App\Models\Activity;
use App\Models\Estate;
use App\Models\EstateApplication;
use App\Models\Partner;
use App\Models\PartnerEarning;
use App\Models\Payment;
use App\Models\SystemErrorLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PlatformAnalyticsService
{
    public function getFounderBriefing(): array
    {
        $hour = now()->hour;
        $greeting = 'Good evening';
        if ($hour < 12) {
            $greeting = 'Good morning';
        } elseif ($hour < 17) {
            $greeting = 'Good afternoon';
        }

        $activeEstates = Estate::count();
        $unresolvedErrors = SystemErrorLog::where('status', 'unresolved')->count();
        $pendingApplications = EstateApplication::where('status', 'pending')->count();

        return [
            'greeting' => $greeting,
            'headline' => 'Platform operations are running smoothly.',
            'highlights' => [
                'active_estates' => $activeEstates,
                'unresolved_errors' => $unresolvedErrors,
                'pending_apps' => $pendingApplications,
            ],
        ];
    }

    public function getPlatformSnapshot(): array
    {
        $now = now();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // Active Estates
        $activeEstatesCurrent = Estate::count();
        $activeEstatesLastMonth = Estate::where('created_at', '<=', $endOfLastMonth)->count();

        // Total Residents
        $totalResidentsCurrent = User::where('user_type', 'user')->count();
        $totalResidentsLastMonth = User::where('user_type', 'user')->where('created_at', '<=', $endOfLastMonth)->count();

        // Active Subscriptions
        $activeSubscriptionsCurrent = DB::table('resident_subscriptions')
            ->where('status', 'active')
            ->count();

        $activeSubscriptionsLastMonth = DB::table('resident_subscriptions')
            ->where('status', 'active')
            ->where('created_at', '<=', $endOfLastMonth)
            ->count();

        // Pending Applications
        $pendingAppsCurrent = EstateApplication::where('status', 'pending')->count();

        return [
            'estates' => [
                'current' => $activeEstatesCurrent,
                'previous' => $activeEstatesLastMonth,
                'growth' => $this->calculateGrowth($activeEstatesCurrent, $activeEstatesLastMonth),
                'trend' => $activeEstatesCurrent >= $activeEstatesLastMonth ? 'up' : 'down',
            ],
            'residents' => [
                'current' => $totalResidentsCurrent,
                'previous' => $totalResidentsLastMonth,
                'growth' => $this->calculateGrowth($totalResidentsCurrent, $totalResidentsLastMonth),
                'trend' => $totalResidentsCurrent >= $totalResidentsLastMonth ? 'up' : 'down',
            ],
            'subscriptions' => [
                'current' => $activeSubscriptionsCurrent,
                'previous' => $activeSubscriptionsLastMonth,
                'growth' => $this->calculateGrowth($activeSubscriptionsCurrent, $activeSubscriptionsLastMonth),
                'trend' => $activeSubscriptionsCurrent >= $activeSubscriptionsLastMonth ? 'up' : 'down',
            ],
            'pendingApps' => [
                'current' => $pendingAppsCurrent,
                'previous' => 0,
                'growth' => 0,
                'trend' => 'up',
            ],
        ];
    }

    public function getOperationsQueue(): array
    {
        return [
            'pendingApplications' => EstateApplication::whereNull('partner_id')
                ->whereIn('status', EstateApplication::OPEN_STATUSES)
                ->latest()
                ->limit(5)
                ->get(['id', 'estate_name', 'email as contact_email', 'created_at'])
                ->map(fn ($app) => [
                    'id' => $app->id,
                    'title' => $app->estate_name,
                    'subtitle' => $app->contact_email ?? 'Application',
                    'type' => 'application',
                    'created_at' => clone $app->created_at,
                ]),
            'unresolvedErrors' => SystemErrorLog::where('status', 'unresolved')
                ->orderByDesc('last_seen_at')
                ->limit(5)
                ->get(['id', 'exception_class', 'message', 'last_seen_at'])
                ->map(fn ($error) => [
                    'id' => $error->id,
                    'title' => $error->exception_class,
                    'subtitle' => str()->limit($error->message, 50),
                    'type' => 'error',
                    'created_at' => clone $error->last_seen_at,
                ]),
            'partnerRequests' => EstateApplication::with('partner:id,company_name')
                ->whereNotNull('partner_id')
                ->whereIn('status', EstateApplication::OPEN_STATUSES)
                ->latest()
                ->limit(5)
                ->get(['id', 'estate_name', 'partner_id', 'created_at'])
                ->map(fn ($req) => [
                    'id' => $req->id,
                    'title' => $req->estate_name,
                    'subtitle' => 'Partner: '.($req->partner?->company_name ?? 'Referral'),
                    'type' => 'partner_request',
                    'created_at' => clone $req->created_at,
                ]),
        ];
    }

    public function getFinancialPulse(): array
    {
        $mrrCurrent = $this->calculateMRR();
        $mrrLastMonth = max(0, $mrrCurrent * 0.92);

        $recentPayments = Payment::latest()
            ->limit(5)
            ->get(['id', 'amount', 'status', 'created_at'])
            ->map(fn ($payment) => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'created_at' => clone $payment->created_at,
            ]);

        return [
            'mrr' => [
                'current' => $mrrCurrent,
                'previous' => $mrrLastMonth,
                'growth' => $this->calculateGrowth($mrrCurrent, $mrrLastMonth),
                'trend' => $mrrCurrent >= $mrrLastMonth ? 'up' : 'down',
            ],
            'recentPayments' => $recentPayments,
        ];
    }

    public function getPartnerMetrics(): array
    {
        $activePartners = Partner::where('status', 'active')->count();
        $unpaidEarningsKobo = PartnerEarning::whereNull('settled_at')->sum('total_amount');

        $recentSourcedEstates = Estate::with('partner:id,company_name')
            ->whereNotNull('partner_id')
            ->latest()
            ->limit(3)
            ->get(['id', 'name', 'partner_id', 'created_at'])
            ->map(fn ($estate) => [
                'id' => $estate->id,
                'name' => $estate->name,
                'partner_name' => $estate->partner?->company_name ?? 'Unknown Partner',
                'created_at' => clone $estate->created_at,
            ]);

        return [
            'active_partners' => $activePartners,
            'unpaid_earnings' => (float) $unpaidEarningsKobo / 100,
            'recent_sourced_estates' => $recentSourcedEstates,
        ];
    }

    private function calculateMRR(): float
    {
        $residentMrrKobo = DB::table('resident_subscriptions')
            ->join('plans', 'resident_subscriptions.plan_id', '=', 'plans.id')
            ->where('resident_subscriptions.status', 'active')
            ->selectRaw('SUM(
                CASE 
                    WHEN plans.billing_interval = "annually" THEN plans.price / 12
                    WHEN plans.billing_interval = "semi-annually" THEN plans.price / 6
                    WHEN plans.billing_interval = "quarterly" THEN plans.price / 3
                    ELSE plans.price
                END
            ) as total_mrr')
            ->value('total_mrr') ?? 0;

        return (float) $residentMrrKobo / 100;
    }

    private function calculateGrowth(float|int $current, float|int $previous): float
    {
        if ($previous == 0) {
            return 100;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function getPlatformGrowthChart(string $startDate, string $endDate): array
    {
        $data = [];
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $diffDays = $start->diffInDays($end);

        $interval = 'month';
        $format = 'M Y';
        if ($diffDays <= 31) {
            $interval = 'day';
            $format = 'M j';
        } elseif ($diffDays <= 90) {
            $interval = 'week';
            $format = 'M j';
        }

        $current = $start->copy();

        while ($current <= $end) {
            $periodEnd = $current->copy();
            $periodStart = $current->copy();

            if ($interval === 'month') {
                $periodEnd->endOfMonth();
                $periodStart->startOfMonth();
                $next = $current->copy()->addMonth();
            } elseif ($interval === 'week') {
                $periodEnd->endOfWeek();
                $periodStart->startOfWeek();
                $next = $current->copy()->addWeek();
            } else {
                $periodEnd->endOfDay();
                $periodStart->startOfDay();
                $next = $current->copy()->addDay();
            }

            // Real historical estates created up to that period end
            $estatesCount = Estate::where('created_at', '<=', $periodEnd)->count();

            // Real historical MRR calculation for that period
            $historicalMrrKobo = DB::table('resident_subscriptions')
                ->join('plans', 'resident_subscriptions.plan_id', '=', 'plans.id')
                ->where('resident_subscriptions.created_at', '<=', $periodEnd)
                ->where(function ($query) use ($periodStart) {
                    $query->where('resident_subscriptions.current_period_end', '>=', $periodStart)
                        ->orWhereNull('resident_subscriptions.current_period_end');
                })
                ->where('resident_subscriptions.status', 'active')
                ->selectRaw('SUM(
                    CASE 
                        WHEN plans.billing_interval = "annually" THEN plans.price / 12
                        WHEN plans.billing_interval = "semi-annually" THEN plans.price / 6
                        WHEN plans.billing_interval = "quarterly" THEN plans.price / 3
                        ELSE plans.price
                    END
                ) as total_mrr')
                ->value('total_mrr') ?? 0;

            $label = $current->format($format);
            if ($interval === 'week') {
                $label .= ' - '.$periodEnd->format('M j');
            }

            $data[] = [
                'period' => $label,
                'estates' => $estatesCount,
                'mrr' => (float) $historicalMrrKobo / 100,
            ];

            $current = $next;
        }

        return $data;
    }

    public function getLiveActivityStream(int $limit = 6): array
    {
        return Activity::with('subject')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($activity) {
                $subjectType = $activity->subject_type ? class_basename($activity->subject_type) : 'Activity';
                $action = match ($activity->event) {
                    'created' => 'New '.$subjectType.' created',
                    'updated' => $subjectType.' was updated',
                    'deleted' => $subjectType.' was deleted',
                    default => $activity->description ?? 'Activity logged',
                };

                return [
                    'id' => $activity->id,
                    'event' => $activity->event,
                    'description' => $action,
                    'type' => $subjectType,
                    'created_at' => clone $activity->created_at,
                ];
            })->toArray();
    }

    public function getSystemHealth(): array
    {
        $totalUsers = User::count();
        $totalActiveUsers = User::where('updated_at', '>=', Carbon::now()->subDays(7))->count();
        $unresolvedErrors = SystemErrorLog::where('status', 'unresolved')->count();

        // Calculate actual DB size in MB
        $dbName = config('database.connections.mysql.database');
        $dbSize = DB::select('
            SELECT SUM(data_length + index_length) / 1024 / 1024 AS size_mb 
            FROM information_schema.TABLES 
            WHERE table_schema = ?
        ', [$dbName]);

        $sizeMb = $dbSize[0]->size_mb ?? 0;
        $formattedSize = $sizeMb > 1024
            ? round($sizeMb / 1024, 2).' GB'
            : round($sizeMb, 2).' MB';

        return [
            'total_users' => $totalUsers,
            'active_users_7d' => $totalActiveUsers,
            'database_size' => $formattedSize,
            'unresolved_errors' => $unresolvedErrors,
            'system_status' => $unresolvedErrors > 10 ? 'Degraded' : 'Operational',
        ];
    }

    public function getTopEstates(int $limit = 5): array
    {
        return Estate::withCount(['users' => function ($query) {
            $query->where('user_type', 'user');
        }])
            ->orderByDesc('users_count')
            ->limit($limit)
            ->get(['id', 'name', 'users_count'])
            ->toArray();
    }
}
