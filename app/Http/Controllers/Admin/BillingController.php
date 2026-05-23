<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
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

        $overview = $this->billingService->getOverview();
        $recentInvoices = $this->billingService->getInvoices(['per_page' => 5]);

        $query = PaymentTransaction::query()
            ->with('user:id,name,email')
            ->where('estate_id', $estate->id);

        if ($search = request('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = request('status')) {
            $query->where('status', $status);
        }

        $transactions = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Billing/Index', [
            'overview' => $overview,
            'recentInvoices' => $recentInvoices,
            'transactions' => $transactions,
            'filters' => request()->only(['search', 'status']),
            'chargeType' => $estate->settings->charge_type,
        ]);
    }
}
