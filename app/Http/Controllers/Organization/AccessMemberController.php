<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\OrganizationAccessMember;
use App\Models\Scopes\ZoneScope;
use App\Services\Organization\AccessMemberService;
use App\Services\Organization\ArrivalService;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccessMemberController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
        private AccessMemberService $memberService,
        private ArrivalService $arrivalService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $filters = $request->only(['search', 'category', 'status', 'tab']);
        $members = $this->memberService->listMembers($organization, $filters);

        $metrics = $this->arrivalService->getMetrics($organization);
        $activeArrivals = $this->arrivalService->getActiveArrivals($organization);

        $pendingArrivals = $activeArrivals
            ->filter(fn (array $arr) => in_array($arr['confirmation_state'], ['PENDING', 'OVERDUE'], true))
            ->values();

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
            $category = $log->accessCode?->organizationMember?->category ?? 'visitor';

            if ($log->checked_out_at) {
                $type = 'checkout';
                $timestamp = $log->checked_out_at->format('g:i A');
            } elseif ($log->confirmed_at) {
                $type = 'confirmed';
                $timestamp = $log->confirmed_at->format('g:i A');
            } else {
                $type = 'arrival';
                $timestamp = $log->verified_at ? $log->verified_at->format('g:i A') : 'Just now';
            }

            return [
                'id' => $log->id,
                'name' => $displayName,
                'category' => $category,
                'gate' => $gate,
                'time_human' => $timestamp,
                'type' => $type,
                'is_active' => is_null($log->checked_out_at),
            ];
        });

        return Inertia::render('Organization/AccessList', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
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
            'members' => $members,
            'filters' => $filters,
            'initialTab' => $request->query('tab', 'people'),
            'total_access_members' => OrganizationAccessMember::where('organization_id', $organization->id)->count(),
            'metrics' => $metrics,
            'pending_arrivals' => $pendingArrivals,
            'recent_activity' => $recentActivity,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Only organization administrators can add access members.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identifier' => 'nullable|string|max:100',
            'category' => 'required|string|in:student,staff,member,contractor,visitor,other',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'issue_credential' => 'boolean',
        ]);

        $this->memberService->createMember(
            organization: $organization,
            createdBy: $request->user(),
            data: $validated,
            issueCredential: $request->boolean('issue_credential', true)
        );

        return back()->with('success', 'Access member created successfully.');
    }

    public function update(Request $request, OrganizationAccessMember $member): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $member->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identifier' => 'nullable|string|max:100',
            'category' => 'required|string|in:student,staff,member,contractor,visitor,other',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ]);

        $this->memberService->updateMember($member, $validated);

        return back()->with('success', 'Access member updated successfully.');
    }

    public function suspend(Request $request, OrganizationAccessMember $member): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $member->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $this->memberService->suspendMember($member);

        return back()->with('success', 'Access member suspended and credentials revoked.');
    }

    public function activate(Request $request, OrganizationAccessMember $member): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $member->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $this->memberService->activateMember($member);

        return back()->with('success', 'Access member reactivated successfully.');
    }
}
