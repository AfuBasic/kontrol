<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\OrganizationAccessMember;
use App\Models\Scopes\ZoneScope;
use App\Services\Organization\ArrivalService;
use App\Services\OrganizationContextService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
        private ArrivalService $arrivalService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $metrics = $this->arrivalService->getMetrics($organization);
        $activeArrivals = $this->arrivalService->getActiveArrivals($organization);

        // Filter arrivals that need confirmation
        $pendingArrivals = $activeArrivals
            ->filter(fn (array $arr) => in_array($arr['confirmation_state'], ['PENDING', 'OVERDUE'], true))
            ->values();

        // Recent activity feed: latest 8 logs (entries/exits) formatted with human action messages
        $recentLogs = AccessLog::withoutGlobalScope(ZoneScope::class)
            ->where('organization_id', $organization->id)
            ->with(['accessCode.organizationMember'])
            ->latest('verified_at')
            ->take(8)
            ->get();

        $recentActivity = $recentLogs->map(function (AccessLog $log) {
            $visitorName = $log->meta['visitor_name'] ?? 'Visitor';
            $memberName = $log->accessCode?->organizationMember?->name;
            $displayName = $memberName ?: $visitorName;
            $gate = $log->entry_point ?: 'Main Gate';

            if ($log->checked_out_at) {
                $description = "{$displayName} departed";
                $timestamp = $log->checked_out_at->diffForHumans();
                $type = 'checkout';
            } elseif ($log->confirmed_at) {
                $description = "{$displayName}'s arrival was confirmed";
                $timestamp = $log->confirmed_at->diffForHumans();
                $type = 'confirmed';
            } else {
                $description = "{$displayName} arrived via {$gate}";
                $timestamp = $log->verified_at ? $log->verified_at->diffForHumans() : 'Just now';
                $type = 'arrival';
            }

            return [
                'id' => $log->id,
                'name' => $displayName,
                'description' => $description,
                'time_human' => $timestamp,
                'type' => $type,
                'is_active' => is_null($log->checked_out_at),
            ];
        });

        $totalAccessMembers = OrganizationAccessMember::where('organization_id', $organization->id)->count();

        return Inertia::render('Organization/Dashboard', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'type' => $organization->type,
                'access_policy' => $organization->access_policy,
                'arrival_confirmation_required' => $organization->requiresArrivalConfirmation(),
                'confirmation_window_minutes' => $organization->confirmation_window_minutes ?? 15,
                'confirmation_escalation' => $organization->confirmation_escalation ?? 'alert_only',
                'estate_name' => $organization->estate?->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'total_access_members' => $totalAccessMembers,
            'metrics' => $metrics,
            'recent_arrivals' => $activeArrivals->take(10)->values(),
            'pending_arrivals' => $pendingArrivals,
            'recent_activity' => $recentActivity,
        ]);
    }
}
