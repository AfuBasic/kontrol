<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\BillingService;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private BillingService $billingService,
    ) {}

    public function __invoke(): Response
    {
        $estate = $this->estateContext->getEstate();

        // Gate: billing only for charge_type = 'estate'
        abort_if(
            $estate->settings->charge_type !== 'estate',
            403,
            'Billing is not enabled for this estate.'
        );

        $overview = $this->billingService->getOverview();
        $recentInvoices = $this->billingService->getInvoices(['per_page' => 3]);

        return Inertia::render('admin/billing/index', [
            'overview' => $overview,
            'recentInvoices' => $recentInvoices,
        ]);
    }
}
