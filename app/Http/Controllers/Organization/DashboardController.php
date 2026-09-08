<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
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
        $recentArrivals = $this->arrivalService->getActiveArrivals($organization)->take(10)->values();

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
            'metrics' => $metrics,
            'recent_arrivals' => $recentArrivals,
        ]);
    }
}
