<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Billing\InitializeInvoicePaymentAction;
use App\Actions\Billing\PaymentInitializationException;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\ResidentSubscription;
use App\Services\Billing\InvoiceGenerationService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BillingController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private InvoiceGenerationService $invoiceGenerationService,
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::firstOrCreate(
            ['user_id' => $user->id, 'estate_id' => $estate->id],
            ['status' => 'trial', 'trial_ends_at' => now()->addDays(30), 'billing_preference' => 'auto']
        );

        // Ensure pending invoice exists if subscription is active/past_due and not in trial
        if ($subscription->status !== 'trial') {
            $this->invoiceGenerationService->getOrCreatePendingInvoiceForResident($subscription);
        }

        $estateSub = $estate->subscriptionRecord;

        $invoices = Invoice::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->latest()
            ->paginate(5);

        $outstandingInvoices = Invoice::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->orderBy('due_date')
            ->get();

        $outstandingAmount = (int) $outstandingInvoices->sum('amount');
        $nextPayableInvoice = $outstandingInvoices->first();

        return Inertia::render('Resident/Billing/Index', [
            'subscription' => [
                'status' => $subscription->status,
                'billing_preference' => $subscription->billing_preference,
                'has_saved_card' => $subscription->hasSavedCard(),
                'card_brand' => $subscription->card_brand,
                'card_last4' => $subscription->card_last4,
                'current_period_end' => $subscription->current_period_end?->toDateString(),
                'trial_ends_at' => $subscription->trial_ends_at?->toDateString(),
            ],
            'estatePlan' => $estateSub ? [
                'name' => $estateSub->plan->name,
                'price' => $estateSub->plan->price,
                'interval' => $estateSub->billing_interval,
            ] : null,
            'recentInvoices' => $invoices,
            'outstanding' => [
                'amount' => $outstandingAmount,
                'formatted_amount' => '₦'.number_format($outstandingAmount / 100, 2),
                'invoice_count' => $outstandingInvoices->count(),
                'next_invoice_id' => $nextPayableInvoice?->id,
            ],
        ]);
    }

    public function updatePreference(Request $request): RedirectResponse
    {
        $request->validate([
            'billing_preference' => 'required|in:auto,manual',
        ]);

        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        if ($subscription) {
            $subscription->update([
                'billing_preference' => $request->billing_preference,
            ]);
        }

        return back()->with('success', 'Billing preference updated.');
    }

    public function pay(Invoice $invoice, InitializeInvoicePaymentAction $initialize): RedirectResponse|SymfonyResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        abort_if($invoice->user_id !== $user->id, 404);
        abort_if($invoice->estate_id !== $estate->id, 404);

        try {
            $result = $initialize->execute(
                $invoice,
                route('resident.billing.payment.callback'),
                route('resident.billing.index'),
            );
        } catch (PaymentInitializationException $e) {
            return back()->with('error', $e->getUserMessage());
        }

        if ($result->isExternal()) {
            return Inertia::location($result->redirectUrl);
        }

        $redirect = redirect($result->redirectUrl);

        if ($result->hasFlash()) {
            $redirect->with($result->flashType, $result->flashMessage);
        }

        return $redirect;
    }

    public function payOutstanding(InitializeInvoicePaymentAction $initialize): RedirectResponse|SymfonyResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $invoice = Invoice::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->orderBy('due_date')
            ->first();

        if (! $invoice) {
            return back()->with('info', 'You have no outstanding payments.');
        }

        return $this->pay($invoice, $initialize);
    }
}
