<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Services\Organization\ArrivalService;
use App\Services\OrganizationContextService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArrivalController extends Controller
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

        $filters = $request->only(['search', 'admission_basis']);
        $onSiteVisitors = $this->arrivalService->getActiveArrivals($organization, $filters);
        $metrics = $this->arrivalService->getMetrics($organization);

        return Inertia::render('Organization/OnSite', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'estate_name' => $organization->estate?->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'onSiteVisitors' => $onSiteVisitors,
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
                'estate_name' => $organization->estate?->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'logs' => $logs,
            'filters' => $filters,
        ]);
    }
}
