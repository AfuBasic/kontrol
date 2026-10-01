<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Mail\Organization\OrganizationInvitationMail;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
                'is_unrestricted' => $organization->isUnrestricted(),
                'estate_name' => $organization->estate?->name,
                'walk_in' => $organization->walkInStatus(),
                'walk_in_windows' => $organization->publicWindows()
                    ->where('is_active', true)
                    ->orderBy('day_of_week')
                    ->orderBy('start_time')
                    ->get()
                    ->map(fn ($window) => [
                        'id' => $window->id,
                        'name' => $window->name,
                        'day_of_week' => (int) $window->day_of_week,
                        'start_time' => substr($window->start_time, 0, 5),
                        'end_time' => substr($window->end_time, 0, 5),
                    ])
                    ->values(),
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'staff' => $staffMembers,
        ]);
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

        $membershipRecord = OrganizationMembership::updateOrCreate(
            ['user_id' => $user->id, 'organization_id' => $organization->id],
            ['role' => $validated['role'], 'is_active' => true, 'invited_by' => $request->user()->id]
        );

        if ($membershipRecord->wasRecentlyCreated) {
            Mail::to($user->email)->send(
                new OrganizationInvitationMail($user, $organization, $validated['role'])
            );
        }

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
