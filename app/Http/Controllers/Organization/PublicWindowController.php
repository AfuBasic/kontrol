<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Models\OrganizationPublicWindow;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'windows' => $windows,
        ]);
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
            'name' => 'required|string|max:255',
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:255',
        ]);

        $organization->publicWindows()->create($validated);

        return back()->with('success', 'Public access window created.');
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
            'name' => 'required|string|max:255',
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:255',
        ]);

        $window->update($validated);

        return back()->with('success', 'Public access window updated.');
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

        return back()->with('success', 'Public access window deleted.');
    }
}
