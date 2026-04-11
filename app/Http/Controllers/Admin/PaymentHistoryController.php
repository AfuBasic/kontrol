<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;

class PaymentHistoryController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
    ) {}

    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);

        $payments = Invoice::where('estate_id', $estate->id)
            ->where('status', 'paid')
            ->with('plan')
            ->orderBy('paid_at', 'desc')
            ->paginate(15);

        return Inertia::render('admin/billing/payment-history', [
            'payments' => $payments,
        ]);
    }
}
