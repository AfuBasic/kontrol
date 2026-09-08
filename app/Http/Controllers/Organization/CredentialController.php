<?php

namespace App\Http\Controllers\Organization;

use App\Actions\Organization\IssueOrganizationCredentialAction;
use App\Actions\Organization\RenewOrganizationCredentialAction;
use App\Enums\AccessCodeStatus;
use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\EstateOrganization;
use App\Models\OrganizationAccessMember;
use App\Services\OrganizationContextService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CredentialController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
        private IssueOrganizationCredentialAction $issueAction,
        private RenewOrganizationCredentialAction $renewAction,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $query = AccessCode::query()
            ->where('organization_id', $organization->id)
            ->where('type', 'organization')
            ->with(['organizationMember', 'user:id,name'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $term = trim($request->input('search'));
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', "%{$term}%")
                    ->orWhere('visitor_name', 'like', "%{$term}%")
                    ->orWhereHas('organizationMember', fn ($sub) => $sub->where('identifier', 'like', "%{$term}%"));
            });
        }

        $credentials = $query->paginate(25)->through(fn (AccessCode $c) => [
            'id' => $c->id,
            'code' => $c->code,
            'status' => $c->status->value,
            'visitor_name' => $c->visitor_name,
            'member' => $c->organizationMember ? [
                'id' => $c->organizationMember->id,
                'name' => $c->organizationMember->name,
                'identifier' => $c->organizationMember->identifier,
                'category' => $c->organizationMember->category,
            ] : null,
            'issued_by' => $c->user ? ['id' => $c->user->id, 'name' => $c->user->name] : null,
            'expires_at' => $c->expires_at?->toISOString(),
            'expires_at_human' => $c->expires_at?->diffForHumans(),
            'created_at' => $c->created_at?->toISOString(),
        ]);

        return Inertia::render('Organization/Credentials', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'credentials' => $credentials,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function issue(Request $request, OrganizationAccessMember $member): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $member->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'expires_at' => 'nullable|date|after:now',
            'notes' => 'nullable|string|max:255',
        ]);

        $expiresAt = ! empty($validated['expires_at']) ? CarbonImmutable::parse($validated['expires_at']) : null;

        $this->issueAction->execute(
            member: $member,
            issuedBy: $request->user(),
            expiresAt: $expiresAt,
            notes: $validated['notes'] ?? null
        );

        return back()->with('success', 'Credential issued successfully.');
    }

    public function renew(Request $request, AccessCode $credential): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $credential->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'expires_at' => 'nullable|date|after:now',
            'reason' => 'nullable|string|max:255',
        ]);

        $newExpiresAt = ! empty($validated['expires_at']) ? CarbonImmutable::parse($validated['expires_at']) : null;

        $this->renewAction->execute(
            credential: $credential,
            renewedBy: $request->user(),
            newExpiresAt: $newExpiresAt,
            reason: $validated['reason'] ?? null
        );

        return back()->with('success', 'Credential renewed successfully.');
    }

    public function revoke(Request $request, AccessCode $credential): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $credential->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $credential->update([
            'status' => AccessCodeStatus::Revoked,
            'revoked_at' => now(),
        ]);

        return back()->with('success', 'Credential revoked.');
    }
}
