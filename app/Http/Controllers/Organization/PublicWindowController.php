<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Models\OrganizationPublicWindow;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PublicWindowController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $windows = $organization->publicWindows()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->map(fn (OrganizationPublicWindow $w) => [
                'id' => $w->id,
                'name' => $w->name,
                'day_of_week' => $w->day_of_week,
                'start_time' => substr($w->start_time, 0, 5),
                'end_time' => substr($w->end_time, 0, 5),
                'is_active' => $w->is_active,
                'notes' => $w->notes,
                'is_open_now' => $w->isOpenAt(),
            ]);

        return Inertia::render('Organization/PublicWindows', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'access_policy' => $organization->access_policy,
                // Why the organization cannot change its own policy, if it cannot.
                'policy_lock' => $this->policyLock($organization),
                'walk_in' => $organization->walkInStatus(),
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'windows' => $windows,
        ]);
    }

    public function updatePolicy(Request $request): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        if ($this->policyLock($organization) !== null) {
            throw ValidationException::withMessages([
                'access_policy' => ['Hospitals and clinics always admit walk-ins; this cannot be changed.'],
            ]);
        }

        // "Any time" is the estate's decision: an organization may only choose between the two below,
        // including one that the estate has set to "any time" (it can step down, never back up).
        $validated = $request->validate([
            'access_policy' => ['required', 'string', 'in:managed,public_window'],
        ], [
            'access_policy.in' => 'Only the estate admin can allow walk-ins at any time.',
        ]);

        $previous = $organization->access_policy;

        if ($previous !== $validated['access_policy']) {
            $organization->update(['access_policy' => $validated['access_policy']]);

            activity('access')
                ->causedBy($request->user())
                ->performedOn($organization)
                ->withProperties(['from' => $previous, 'to' => $validated['access_policy']])
                ->log("Walk-in policy for {$organization->name} changed from {$previous} to {$validated['access_policy']}");
        }

        return back()->with('success', 'Walk-in policy updated.');
    }

    /**
     * Why this organization cannot change its own walk-in policy, or null when it can.
     *
     * Hospitals are never blocked, so theirs is fixed at "any time".
     */
    private function policyLock(EstateOrganization $organization): ?string
    {
        return $organization->type === 'hospital' ? 'hospital' : null;
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            // One window per selected day, so "Mon–Fri 7:30–8:30" is a single action.
            'days' => 'required|array|min:1',
            'days.*' => 'integer|between:0,6|distinct',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'notes' => 'nullable|string|max:255',
        ], [
            'days.required' => 'Pick at least one day.',
            'end_time.after' => 'Closing time must be after opening time.',
        ]);

        DB::transaction(function () use ($organization, $validated) {
            foreach ($validated['days'] as $day) {
                $organization->publicWindows()->create([
                    'name' => ($validated['name'] ?? null) ?: 'Walk-in hours',
                    'day_of_week' => $day,
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'],
                    'is_active' => true,
                    'notes' => $validated['notes'] ?? null,
                ]);
            }
        });

        return back()->with('success', count($validated['days']) === 1 ? 'Walk-in hours added.' : 'Walk-in hours added for '.count($validated['days']).' days.');
    }

    public function update(Request $request, OrganizationPublicWindow $window): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $window->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:255',
        ], [
            'end_time.after' => 'Closing time must be after opening time.',
        ]);

        $window->update([...$validated, 'name' => ($validated['name'] ?? null) ?: 'Walk-in hours']);

        return back()->with('success', 'Walk-in hours updated.');
    }

    public function destroy(Request $request, OrganizationPublicWindow $window): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $window->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $window->delete();

        return back()->with('success', 'Walk-in hours removed.');
    }
}
