<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Models\OrganizationAccessMember;
use App\Services\Organization\AccessMemberService;
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
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $filters = $request->only(['search', 'category', 'status']);
        $members = $this->memberService->listMembers($organization, $filters);

        return Inertia::render('Organization/AccessList', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'access_policy' => $organization->access_policy,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'members' => $members,
            'filters' => $filters,
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
