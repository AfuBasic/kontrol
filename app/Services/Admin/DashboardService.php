<?php

namespace App\Services\Admin;

use App\Enums\AccessCodeStatus;
use App\Enums\EstateBoardPostStatus;
use App\Enums\IncidentStatus;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\EstateTransaction;
use App\Models\Incident;
use App\Models\Property;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class DashboardService
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Get overview statistics for the dashboard.
     */
    public function getOverviewStats(): array
    {
        $estate = $this->estateContext->getEstate();
        $estateId = $estate->id;

        // Optimized resident stats
        $residentStats = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when suspended_at is null and email_verified_at is not null then 1 else 0 end) as active')
            ->toBase()
            ->first();

        // Optimized security personnel stats
        $securityStats = User::query()
            ->forEstate($estateId)
            ->withRole('security', $estateId)
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when suspended_at is null and email_verified_at is not null then 1 else 0 end) as active')
            ->toBase()
            ->first();

        // Optimized posts stats
        $postStats = EstateBoardPost::forEstate($estateId)
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when status = ? and published_at is not null then 1 else 0 end) as published', [EstateBoardPostStatus::Published->value])
            ->selectRaw('sum(case when status = ? then 1 else 0 end) as draft', [EstateBoardPostStatus::Draft->value])
            ->toBase()
            ->first();

        // Get comments count
        $totalComments = EstateBoardComment::where('estate_id', $estateId)->count();

        // Calculate trends (comparing to previous period)
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sixtyDaysAgo = $now->copy()->subDays(60);

        // Optimized resident trends
        $residentTrends = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->selectRaw('sum(case when created_at >= ? then 1 else 0 end) as new_this_period', [$thirtyDaysAgo])
            ->selectRaw('sum(case when created_at >= ? and created_at < ? then 1 else 0 end) as new_last_period', [$sixtyDaysAgo, $thirtyDaysAgo])
            ->toBase()
            ->first();

        $residentsTrend = $residentTrends->new_last_period > 0
            ? round((($residentTrends->new_this_period - $residentTrends->new_last_period) / $residentTrends->new_last_period) * 100, 1)
            : ($residentTrends->new_this_period > 0 ? 100 : 0);

        // Optimized posts trends
        $postsTrends = EstateBoardPost::forEstate($estateId)
            ->selectRaw('sum(case when created_at >= ? then 1 else 0 end) as new_this_period', [$thirtyDaysAgo])
            ->selectRaw('sum(case when created_at >= ? and created_at < ? then 1 else 0 end) as new_last_period', [$sixtyDaysAgo, $thirtyDaysAgo])
            ->toBase()
            ->first();

        $postsTrend = $postsTrends->new_last_period > 0
            ? round((($postsTrends->new_this_period - $postsTrends->new_last_period) / $postsTrends->new_last_period) * 100, 1)
            : ($postsTrends->new_this_period > 0 ? 100 : 0);

        return [
            'residents' => [
                'total' => $residentStats->total,
                'active' => $residentStats->active ?? 0,
                'trend' => $residentsTrend ?? 0,
                'new_this_month' => $residentTrends->new_this_period ?? 0,
            ],
            'security' => [
                'total' => $securityStats->total,
                'active' => $securityStats->active ?? 0,
            ],
            'posts' => [
                'total' => $postStats->total,
                'published' => $postStats->published ?? 0,
                'draft' => $postStats->draft ?? 0,
                'trend' => $postsTrend ?? 0,
                'new_this_month' => $postsTrends->new_this_period ?? 0,
            ],
            'comments' => [
                'total' => $totalComments,
            ],
            'estate' => [
                'id' => $estate->id,
                'ulid' => $estate->ulid,
                'name' => $estate->name,
                'address' => $estate->address,
            ],
        ];
    }

    /**
     * Get detailed, operational dashboard statistics.
     *
     * Memoized per request so multiple deferred prop closures share one computation.
     */
    public function getDetailedDashboardStats(): array
    {
        return once(fn () => $this->computeDetailedDashboardStats());
    }

    /**
     * @return array<string, mixed>
     */
    private function computeDetailedDashboardStats(): array
    {
        $estate = $this->estateContext->getEstate();
        $estateId = $estate->id;
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        // 1. Core Counts
        $residentsTotal = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->count();

        $residentsActive = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->whereNull('suspended_at')
            ->whereNotNull('email_verified_at')
            ->count();

        $residentsAwaitingApproval = DB::table('estate_users_membership')
            ->where('estate_id', $estateId)
            ->where('status', 'pending')
            ->count();

        $securityTotal = User::query()
            ->forEstate($estateId)
            ->withRole('security', $estateId)
            ->count();

        $securityActive = User::query()
            ->forEstate($estateId)
            ->withRole('security', $estateId)
            ->whereNull('suspended_at')
            ->whereNotNull('email_verified_at')
            ->count();

        $propertiesOccupied = Property::where('estate_id', $estateId)
            ->where(fn ($q) => $q->whereNotNull('property_owner_id')->orWhereHas('residents'))
            ->count();

        $announcementsPublished = EstateBoardPost::forEstate($estateId)
            ->where('status', EstateBoardPostStatus::Published->value)
            ->count();

        // 2. Security & Operations
        $openIncidents = Incident::where('estate_id', $estateId)
            ->whereIn('status', [IncidentStatus::Pending, IncidentStatus::Acknowledged, IncidentStatus::Resolving])
            ->count();

        $visitorsExpectedToday = AccessCode::where('estate_id', $estateId)
            ->whereIn('status', [AccessCodeStatus::Active, AccessCodeStatus::Scheduled])
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhereDate('expires_at', '>=', Carbon::today());
            })
            ->count();

        $visitorsCheckedInToday = AccessLog::where('estate_id', $estateId)
            ->whereDate('verified_at', $today)
            ->count();

        $visitorsCheckedOutToday = AccessLog::where('estate_id', $estateId)
            ->whereDate('checked_out_at', $today)
            ->count();

        // 3. Finance & Collections (Excluding collections created by property owners)
        $collectionFilter = function ($q) use ($estateId) {
            $q->where('estate_id', $estateId)
                ->whereDoesntHave('creator.roles', function ($sq) use ($estateId) {
                    $sq->where('name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estateId);
                });
        };

        $collectionsThisMonth = (int) CollectionAssignment::whereHas('collection', $collectionFilter)
            ->whereDate('updated_at', '>=', $startOfMonth)
            ->sum('amount_paid');

        $totalAssigned = CollectionAssignment::whereHas('collection', $collectionFilter)->sum('amount_due');
        $totalPaid = CollectionAssignment::whereHas('collection', $collectionFilter)->sum('amount_paid');
        $collectionRate = $totalAssigned > 0 ? round(($totalPaid / $totalAssigned) * 100, 1) : 0;

        $outstandingBalances = (int) CollectionAssignment::whereHas('collection', $collectionFilter)
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->get()
            ->sum(fn ($a) => $a->amount_due - $a->amount_paid);

        $transactionFilter = function ($q) use ($estateId) {
            $q->where('estate_id', $estateId)
                ->where('type', '!=', TransactionType::SubscriptionPayment->value)
                ->where(function ($query) use ($estateId) {
                    $query->whereNull('collection_id')
                        ->orWhereHas('collection', function ($sq) use ($estateId) {
                            $sq->whereDoesntHave('creator.roles', function ($ssq) use ($estateId) {
                                $ssq->where('name', 'property_owner')
                                    ->where('model_has_roles.estate_id', $estateId);
                            });
                        });
                });
        };

        $failedPaymentsCount = EstateTransaction::where($transactionFilter)
            ->where('status', TransactionStatus::Failed)
            ->count();

        // 4. Estate Health Status Resolving
        $status = 'normal';
        $statusLabel = '🟢 Estate Operating Normally';

        if ($openIncidents > 2) {
            $status = 'critical';
            $statusLabel = '🔴 Critical Issues';
        } elseif ($residentsAwaitingApproval > 0 || $outstandingBalances > 1000000 || $failedPaymentsCount > 0) {
            $status = 'attention';
            $statusLabel = '🟠 Attention Required';
        }

        // Summary bullet points
        $summary = [
            "{$collectionRate}% overall collection rate",
            $openIncidents > 0 ? "{$openIncidents} unresolved incident".($openIncidents > 1 ? 's' : '') : 'No unresolved security incidents',
            "{$visitorsExpectedToday} visitor".($visitorsExpectedToday !== 1 ? 's' : '').' expected today',
            $residentsAwaitingApproval > 0 ? "{$residentsAwaitingApproval} resident".($residentsAwaitingApproval > 1 ? 's' : '').' awaiting approval' : 'No pending resident approvals',
        ];

        // 5. Build Action Center Items
        $needsAttention = [];

        if ($residentsAwaitingApproval > 0) {
            $pendingResidents = User::query()
                ->forEstate($estateId)
                ->withRole('resident', $estateId)
                ->whereHas('estates', fn ($q) => $q->where('estates.id', $estateId)->where('estate_users_membership.status', 'pending'))
                ->with('profile')
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'title' => $u->name,
                    'subtitle' => $u->profile?->unit_number ? "Unit {$u->profile->unit_number}" : 'Unassigned Unit',
                    'context' => 'Requested '.($u->created_at?->diffForHumans() ?? 'recently'),
                ])
                ->values()
                ->all();

            $needsAttention[] = [
                'id' => 'residents_approval',
                'type' => 'residents_approval',
                'title' => 'Pending Resident Approvals',
                'desc' => "{$residentsAwaitingApproval} resident".($residentsAwaitingApproval > 1 ? 's' : '').' requested access and require verification.',
                'count' => $residentsAwaitingApproval,
                'severity' => 'warning',
                'actionLabel' => 'Review Approvals',
                'actionUrl' => route('admin.residents.index'),
                'previews' => $pendingResidents,
            ];
        }

        if ($openIncidents > 0) {
            $openIncidentsList = Incident::where('estate_id', $estateId)
                ->whereIn('status', [IncidentStatus::Pending, IncidentStatus::Acknowledged, IncidentStatus::Resolving])
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($inc) => [
                    'id' => $inc->id,
                    'title' => $inc->title ?? 'Security Incident',
                    'subtitle' => $inc->location ?? 'Estate Grounds',
                    'context' => 'Reported '.($inc->created_at?->diffForHumans() ?? 'recently'),
                ])
                ->values()
                ->all();

            $needsAttention[] = [
                'id' => 'pending_incidents',
                'type' => 'pending_incidents',
                'title' => 'Pending Security Incidents',
                'desc' => "{$openIncidents} security or facility incident".($openIncidents > 1 ? 's' : '').' require resolution.',
                'count' => $openIncidents,
                'severity' => 'critical',
                'actionLabel' => 'Resolve Incidents',
                'actionUrl' => route('admin.incidents.index'),
                'previews' => $openIncidentsList,
            ];
        }

        // Residents Without Assigned Units
        $unassignedCount = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->whereNull('suspended_at')
            ->where(function ($q) {
                $q->whereDoesntHave('profile')
                    ->orWhereHas('profile', fn ($sq) => $sq->whereNull('unit_number')->orWhere('unit_number', ''));
            })
            ->count();

        if ($unassignedCount > 0) {
            $unassignedResidents = User::query()
                ->forEstate($estateId)
                ->withRole('resident', $estateId)
                ->whereNull('suspended_at')
                ->where(function ($q) {
                    $q->whereDoesntHave('profile')
                        ->orWhereHas('profile', fn ($sq) => $sq->whereNull('unit_number')->orWhere('unit_number', ''));
                })
                ->take(5)
                ->get()
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'title' => $u->name,
                    'subtitle' => 'No unit assigned',
                    'context' => 'Joined '.($u->created_at?->diffForHumans() ?? 'recently'),
                ])
                ->values()
                ->all();

            $needsAttention[] = [
                'id' => 'unassigned_units',
                'type' => 'unassigned_units',
                'title' => 'Residents Without Assigned Units',
                'desc' => "{$unassignedCount} active resident".($unassignedCount > 1 ? 's' : '').' require property unit assignments.',
                'count' => $unassignedCount,
                'severity' => 'info',
                'actionLabel' => 'Assign Units',
                'actionUrl' => route('admin.residents.index'),
                'previews' => $unassignedResidents,
            ];
        }

        if ($outstandingBalances > 0 || $failedPaymentsCount > 0) {
            $needsAttention[] = [
                'id' => 'outstanding_dues',
                'type' => 'outstanding_dues',
                'title' => 'Outstanding Estate Dues',
                'desc' => 'Estate is currently owed ₦'.number_format($outstandingBalances).' in unpaid member dues with '.$failedPaymentsCount.' failed payment attempt(s).',
                'count' => $failedPaymentsCount > 0 ? $failedPaymentsCount : 1,
                'severity' => 'warning',
                'actionLabel' => 'Review Dues',
                'actionUrl' => route('admin.collections.index'),
                'previews' => [],
            ];
        }

        // Recent Payments
        $recentPayments = EstateTransaction::where($transactionFilter)
            ->where('status', TransactionStatus::Success)
            ->with(['user:id,name', 'collection'])
            ->latest('paid_at')
            ->take(5)
            ->get()
            ->map(fn ($tx) => [
                'id' => $tx->id,
                'user_name' => $tx->user?->name ?? 'Resident',
                'amount' => $tx->amount / 100,
                'paid_at' => $tx->paid_at?->diffForHumans() ?? $tx->created_at->diffForHumans(),
                'collection_name' => $tx->collection?->name ?? $tx->description ?? 'Dues Payment',
            ]);

        // Recent Gate Activity
        $recentGateActivity = AccessLog::where('estate_id', $estateId)
            ->with(['accessCode.user', 'verifier'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'visitor_name' => $log->accessCode->visitor_name ?? 'Visitor',
                'resident_name' => $log->accessCode->user->name ?? 'Resident',
                'type' => $log->checked_out_at ? 'checkout' : 'checkin',
                'time' => $log->checked_out_at ? $log->checked_out_at->diffForHumans() : $log->verified_at->diffForHumans(),
                'verifier_name' => $log->verifier->name ?? 'Security Guard',
            ]);

        return [
            'estateHealth' => [
                'name' => $estate->name,
                'address' => $estate->address,
                'status' => $status,
                'statusLabel' => $statusLabel,
                'summary' => $summary,
            ],
            'needsAttention' => $needsAttention,
            'operationalSnapshot' => [
                'residentsTotal' => $residentsTotal,
                'residentsActive' => $residentsActive,
                'propertiesTotal' => $propertiesOccupied,
                'visitorsToday' => $visitorsExpectedToday,
                'securityOnDuty' => $securityActive,
                'collectionsThisMonth' => $collectionsThisMonth,
                'outstandingDues' => $outstandingBalances,
                'openIncidents' => $openIncidents,
                'announcementsPublished' => $announcementsPublished,
            ],
            'financialOverview' => [
                'collectionsThisMonth' => $collectionsThisMonth,
                'outstandingBalances' => $outstandingBalances,
                'collectionRate' => $collectionRate,
                'recentPayments' => $recentPayments,
            ],
            'securityOperations' => [
                'securityOnDuty' => $securityActive,
                'visitorsExpected' => $visitorsExpectedToday,
                'visitorsCheckedIn' => $visitorsCheckedInToday,
                'visitorsCheckedOut' => $visitorsCheckedOutToday,
                'openIncidents' => $openIncidents,
                'recentGateActivity' => $recentGateActivity,
            ],
            'estate' => [
                'id' => $estate->id,
                'ulid' => $estate->ulid,
                'name' => $estate->name,
                'address' => $estate->address,
            ],
        ];
    }

    /**
     * Get recent activity logs.
     * Only return meaningful operational activity logs.
     */
    public function getRecentActivity(int $limit = 10): Collection
    {
        $estate = $this->estateContext->getEstate();

        return Activity::query()
            ->where(function ($query) use ($estate) {
                $query->where('properties->estate_id', $estate->id)
                    ->orWhere(function ($q) use ($estate) {
                        $q->whereHasMorph('subject', [EstateBoardPost::class], function ($sq) use ($estate) {
                            $sq->where('estate_id', $estate->id);
                        });
                    });
            })
            ->where(function ($query) use ($estate) {
                $query->whereNull('causer_id')
                    ->orWhereDoesntHave('causer.roles', function ($q) use ($estate) {
                        $q->where('name', 'property_owner')
                            ->where('model_has_roles.estate_id', $estate->id);
                    });
            })
            ->with('causer:id,ulid,name,email')
            ->latest()
            ->get()
            ->filter(function ($activity) {
                // Filter down to only meaningful operational activities
                $desc = strtolower($activity->description);

                return str_contains($desc, 'registered') ||
                       str_contains($desc, 'approved') ||
                       str_contains($desc, 'checked') ||
                       str_contains($desc, 'reported') ||
                       str_contains($desc, 'resolved') ||
                       str_contains($desc, 'paid') ||
                       str_contains($desc, 'published') ||
                       str_contains($desc, 'added') ||
                       str_contains($desc, 'assigned') ||
                       str_contains($desc, 'received');
            })
            ->take($limit)
            ->values()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'description' => $activity->description,
                'causer' => $activity->causer ? [
                    'name' => $activity->causer->name,
                    'email' => $activity->causer->email,
                ] : null,
                'subject_type' => class_basename($activity->subject_type ?? ''),
                'created_at' => $activity->created_at->diffForHumans(),
                'created_at_full' => $activity->created_at->format('M j, Y g:i A'),
            ]);
    }

    /**
     * Get recent estate board posts.
     */
    public function getRecentPosts(int $limit = 5): Collection
    {
        $estate = $this->estateContext->getEstate();

        return EstateBoardPost::forEstate($estate->id)
            ->published()
            ->with(['author:id,ulid,name', 'media'])
            ->withCount('comments')
            ->latest('published_at')
            ->take($limit)
            ->get()
            ->map(fn (EstateBoardPost $post) => [
                'id' => $post->id,
                'hashid' => $post->hashid,
                'title' => $post->title,
                'body' => $post->body,
                'author' => [
                    'name' => $post->author->name,
                ],
                'comments_count' => $post->comments_count,
                'media_count' => $post->media->count(),
                'has_media' => $post->media->isNotEmpty(),
                'published_at' => $post->published_at->diffForHumans(),
                'audience' => $post->audience->value,
            ]);
    }

    /**
     * Get quick stats for today.
     */
    public function getTodayStats(): array
    {
        $estate = $this->estateContext->getEstate();
        $estateId = $estate->id;
        $today = Carbon::today();

        return [
            'new_posts' => EstateBoardPost::forEstate($estateId)
                ->whereDate('created_at', $today)
                ->count(),
            'new_comments' => EstateBoardComment::where('estate_id', $estateId)
                ->whereDate('created_at', $today)
                ->count(),
            'new_residents' => User::query()
                ->forEstate($estateId)
                ->withRole('resident', $estateId)
                ->whereDate('created_at', $today)
                ->count(),
        ];
    }
}
