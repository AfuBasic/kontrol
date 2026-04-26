<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\BillingService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $overview = $this->billingService->getOverview();
        $recentInvoices = $this->billingService->getInvoices(['per_page' => 5]);

        return Inertia::render('Admin/Billing/Index', [
            'overview' => $overview,
            'recentInvoices' => $recentInvoices,
            'chargeType' => $estate->settings->charge_type,
        ]);
    }

    public function updatePreference(Request $request): RedirectResponse
    {
        $request->validate([
            'billing_preference' => 'required|in:auto,manual',
        ]);

        $estate = $this->estateContext->getEstate();
        $subscription = $estate->subscriptionRecord;

        if ($subscription) {
            $subscription->update([
                'billing_preference' => $request->billing_preference,
            ]);
        }

        return back()->with('success', 'Billing preference updated.');
    }
}
