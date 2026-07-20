<?php

namespace App\Services\Admin;

use App\Enums\AccessCodeStatus;
use App\Enums\EstateBoardPostStatus;
use App\Enums\IncidentStatus;
use App\Enums\TransactionStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\EstateTransaction;
use App\Models\Incident;
use App\Models\Property;
use App\Models\SosEvent;
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
     * Get detailed, operational dashboard statistics.
     */
    public function getDetailedDashboardStats(): array
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

        $activeEmergencyAlerts = SosEvent::where('estate_id', $estateId)
            ->where('status', '!=', 'resolved')
            ->count();

        // 3. Finance & Collections
        $collectionsThisMonth = CollectionAssignment::where('estate_id', $estateId)
            ->whereDate('updated_at', '>=', $startOfMonth)
            ->sum('amount_paid');

        $totalAssigned = CollectionAssignment::where('estate_id', $estateId)->sum('amount_due');
        $totalPaid = CollectionAssignment::where('estate_id', $estateId)->sum('amount_paid');
        $collectionRate = $totalAssigned > 0 ? round(($totalPaid / $totalAssigned) * 100, 1) : 0;

        $outstandingBalances = CollectionAssignment::where('estate_id', $estateId)
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->get()
            ->sum(fn ($a) => $a->amount_due - $a->amount_paid);

        $failedPaymentsCount = EstateTransaction::where('estate_id', $estateId)
            ->where('status', TransactionStatus::Failed)
            ->count();

        // 4. Estate Health Status Resolving
        $status = 'normal';
        $statusLabel = '🟢 Estate Operating Normally';

        if ($activeEmergencyAlerts > 0 || $openIncidents > 2) {
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

        // 5. Build Needs Attention List
        $needsAttention = [];

        if ($residentsAwaitingApproval > 0) {
            $needsAttention[] = [
                'type' => 'residents_approval',
                'title' => 'Residents Awaiting Approval',
                'desc' => "{$residentsAwaitingApproval} resident".($residentsAwaitingApproval > 1 ? 's' : '').' requested to join and need approval.',
                'severity' => 'warning',
                'actionUrl' => route('admin.residents.index'),
            ];
        }

        if ($openIncidents > 0) {
            $needsAttention[] = [
                'type' => 'pending_incidents',
                'title' => 'Pending Incident Reports',
                'desc' => "{$openIncidents} security or facility incident".($openIncidents > 1 ? 's' : '').' require resolution.',
                'severity' => 'danger',
                'actionUrl' => '/admin/incidents', // Or exact incidents index route
            ];
        }

        if ($outstandingBalances > 0) {
            $needsAttention[] = [
                'type' => 'outstanding_dues',
                'title' => 'Outstanding Estate Dues',
                'desc' => 'Estate is currently owed ₦'.number_format($outstandingBalances).' in unpaid member dues.',
                'severity' => 'info',
                'actionUrl' => route('admin.collections.index'),
            ];
        }

        if ($failedPaymentsCount > 0) {
            $needsAttention[] = [
                'type' => 'failed_payments',
                'title' => 'Failed Transactions',
                'desc' => "{$failedPaymentsCount} payment attempt".($failedPaymentsCount > 1 ? 's' : '').' failed recently.',
                'severity' => 'warning',
                'actionUrl' => route('admin.collections.index'),
            ];
        }

        if ($activeEmergencyAlerts > 0) {
            $needsAttention[] = [
                'type' => 'active_sos',
                'title' => 'Active SOS Panic Alerts',
                'desc' => "{$activeEmergencyAlerts} emergency panic alert".($activeEmergencyAlerts > 1 ? 's' : '').' triggered by residents!',
                'severity' => 'danger',
                'actionUrl' => '/admin/sos', // SOS page
            ];
        }

        // Recent Payments
        $recentPayments = EstateTransaction::where('estate_id', $estateId)
            ->where('status', TransactionStatus::Success)
            ->with(['user:id,name', 'collection'])
            ->latest('paid_at')
            ->take(5)
            ->get()
            ->map(fn ($tx) => [
                'id' => $tx->id,
                'user_name' => $tx->user?->name ?? 'Resident',
                'amount' => $tx->amount,
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
                'emergencyAlerts' => $activeEmergencyAlerts,
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
            ->where('properties->estate_id', $estate->id)
            ->orWhere(function ($query) use ($estate) {
                $query->whereHasMorph('subject', [EstateBoardPost::class], function ($q) use ($estate) {
                    $q->where('estate_id', $estate->id);
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
