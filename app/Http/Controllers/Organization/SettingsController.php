<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $staffMembers = $organization->memberships()
            ->with('user:id,name,email')
            ->get()
            ->map(fn (OrganizationMembership $m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'name' => $m->user?->name,
                'email' => $m->user?->email,
                'role' => $m->role,
                'is_active' => $m->is_active,
                'created_at' => $m->created_at?->toISOString(),
            ]);

        return Inertia::render('Organization/Settings', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'type' => $organization->type,
                'access_policy' => $organization->access_policy,
                'arrival_confirmation_required' => $organization->requiresArrivalConfirmation(),
                'confirmation_window_minutes' => $organization->confirmation_window_minutes ?? 15,
                'confirmation_escalation' => $organization->confirmation_escalation ?? 'alert_only',
                'operating_hours' => $organization->operating_hours,
                'is_unrestricted' => $organization->isUnrestricted(),
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'staff' => $staffMembers,
        ]);
    }

    public function updateConfirmationPolicy(Request $request): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        // If organization is unrestricted (hospital), confirmation cannot be enabled
        if ($organization->isUnrestricted()) {
            abort(422, 'Unrestricted organizations cannot require arrival confirmation.');
        }

        $validated = $request->validate([
            'arrival_confirmation_required' => 'required|boolean',
            'confirmation_window_minutes' => 'required|integer|between:5,120',
            'confirmation_escalation' => 'required|string|in:alert_only,flag_security',
        ]);

        $organization->update($validated);

        return back()->with('success', 'Arrival confirmation policy updated.');
    }

    public function inviteStaff(Request $request): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:admin,member',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return back()->withErrors(['email' => 'User with this email is not registered on Kontrol.']);
        }

        OrganizationMembership::updateOrCreate(
            ['user_id' => $user->id, 'organization_id' => $organization->id],
            ['role' => $validated['role'], 'is_active' => true, 'invited_by' => $request->user()->id]
        );

        return back()->with('success', "Staff access granted to {$user->name}.");
    }

    public function removeStaff(Request $request, OrganizationMembership $targetMembership): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $targetMembership->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        if ($targetMembership->user_id === $request->user()->id) {
            return back()->withErrors(['error' => 'You cannot remove yourself from organization staff.']);
        }

        $targetMembership->delete();

        return back()->with('success', 'Staff member removed.');
    }
}
