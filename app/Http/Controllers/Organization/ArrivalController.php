<?php

namespace App\Http\Controllers\Organization;

use App\Actions\Organization\ConfirmArrivalAction;
use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Services\Organization\ArrivalService;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArrivalController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
        private ArrivalService $arrivalService,
        private ConfirmArrivalAction $confirmAction,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $filters = $request->only(['search', 'admission_basis']);
        $arrivals = $this->arrivalService->getActiveArrivals($organization, $filters);
        $metrics = $this->arrivalService->getMetrics($organization);

        return Inertia::render('Organization/Arrivals', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'arrival_confirmation_required' => $organization->requiresArrivalConfirmation(),
                'confirmation_window_minutes' => $organization->confirmation_window_minutes ?? 15,
                'confirmation_escalation' => $organization->confirmation_escalation ?? 'alert_only',
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'arrivals' => $arrivals,
            'metrics' => $metrics,
            'filters' => $filters,
        ]);
    }

    public function history(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $filters = $request->only(['search', 'date', 'status']);
        $logs = $this->arrivalService->getArrivalHistory($organization, $filters);

        return Inertia::render('Organization/History', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'logs' => $logs,
            'filters' => $filters,
        ]);
    }

    public function confirm(Request $request, int|string $log): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();

        /** @var AccessLog $accessLog */
        $accessLog = AccessLog::withoutZoneIsolation()
            ->where('organization_id', $organization->id)
            ->findOrFail($log);

        $this->confirmAction->execute($accessLog, $request->user());

        return back()->with('success', 'Arrival confirmed successfully.');
    }
}
