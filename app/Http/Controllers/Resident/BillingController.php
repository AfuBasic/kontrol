<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Auth\GenerateMagicLoginUrlAction;
use App\Actions\Billing\InitializeCardSetupAction;
use App\Actions\Billing\InitializeInvoicePaymentAction;
use App\Actions\Billing\PaymentInitializationException;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\ResidentSubscription;
use App\Services\Billing\InvoiceGenerationService;
use App\Services\EstateContextService;
use App\Services\ResidentSubscriptionService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BillingController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private InvoiceGenerationService $invoiceGenerationService,
    ) {}

    public function index(): Response|RedirectResponse
    {
        $user = auth()->user();
        abort_if($user->isHouseholdMember(), 403, 'Household members do not have access to billing.');

        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        if (! $subscription) {
            $service = app(ResidentSubscriptionService::class);
            $subscription = $service->createForUser($user, $estate);
        }

        if (! $subscription) {
            return redirect()->route('resident.home')->with('info', 'Billing is managed by your estate.');
        }

        // Ensure pending invoice exists if subscription is due or expiring soon
        $this->invoiceGenerationService->getOrCreatePendingInvoiceForResident($subscription);

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
                'next_invoice_ulid' => $nextPayableInvoice?->ulid,
                'next_due_date' => $nextPayableInvoice?->due_date?->toDateString(),
            ],
        ]);
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

    public function setupPaymentMethod(InitializeCardSetupAction $action): RedirectResponse|SymfonyResponse
    {
        $user = auth()->user();

        try {
            $redirectUrl = $action->execute(
                $user,
                route('resident.billing.payment.callback')
            );

            return Inertia::location($redirectUrl);
        } catch (Exception $e) {
            return back()->with('error', 'Failed to initialize card setup: '.$e->getMessage());
        }
    }

    public function generateMagicUrl(GenerateMagicLoginUrlAction $action): JsonResponse
    {
        $user = auth()->user();
        $url = $action->execute($user, route('resident.billing.index', [], false));

        return response()->json([
            'status' => 'success',
            'magic_url' => $url,
        ]);
    }
}
