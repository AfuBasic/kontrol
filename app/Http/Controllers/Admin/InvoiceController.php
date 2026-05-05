<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Billing\InitializeInvoicePaymentAction;
use App\Actions\Billing\PaymentInitializationException;
use App\Http\Controllers\Controller;
use App\Mail\SendInvoiceMail;
use App\Models\Invoice;
use App\Services\Admin\BillingService;
use App\Services\Billing\InvoiceGenerationService;
use App\Services\Billing\PaymentVerificationService;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class InvoiceController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private BillingService $billingService,
        private PaystackService $paystackService,
        private InvoiceGenerationService $invoiceGenerationService,
    ) {}

    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);

        $invoices = Invoice::where('estate_id', $estate->id)
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/Billing/Invoices', [
            'invoices' => $invoices,
        ]);
    }

    /**
     * Show pending (or generate) invoice for the current estate.
     * Refreshes invoice on every page load.
     */
    public function showPending(): Response
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);

        $invoice = $this->invoiceGenerationService->getOrCreatePendingInvoice($estate);

        abort_if(! $invoice, 404, 'No pending invoice. Add residents to your estate to generate an invoice.');

        // Share pending invoice globally for the notification banner
        Inertia::share('pendingInvoice', [
            'id' => $invoice->id,
            'ulid' => $invoice->ulid,
            'invoice_number' => $invoice->invoice_number,
            'amount' => $invoice->amount,
            'status' => $invoice->status,
            'due_date' => $invoice->due_date?->toDateString(),
            'created_at' => $invoice->created_at?->toDateString(),
        ]);

        return Inertia::render('Admin/Billing/InvoiceDetail', [
            'invoice' => $invoice->load(['plan', 'paymentTransactions']),
        ]);
    }

    public function show(Invoice $invoice): Response
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);
        abort_if($invoice->estate_id !== $estate->id, 404);

        return Inertia::render('Admin/Billing/InvoiceDetail', [
            'invoice' => $invoice->load(['plan', 'paymentTransactions']),
        ]);
    }

    public function pay(Invoice $invoice, InitializeInvoicePaymentAction $initialize): RedirectResponse|SymfonyResponse
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);
        abort_if($invoice->estate_id !== $estate->id, 404);

        try {
            $result = $initialize->execute(
                $invoice,
                route('admin.billing.payment.callback'),
                route('admin.billing.invoices.show', $invoice->id),
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

    /**
     * Send invoice to estate's email address.
     */
    public function sendInvoice(Invoice $invoice): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);
        abort_if($invoice->estate_id !== $estate->id, 404);

        // Check cooldown to prevent abuse
        if (! $invoice->canSendEmail()) {
            $secondsRemaining = $invoice->getEmailCooldownSeconds();

            return back()->with('warning',
                "Please wait {$secondsRemaining} second".($secondsRemaining !== 1 ? 's' : '').' before sending again.');
        }

        try {
            $email = $estate->email ?? $estate->users()->first()?->email;

            if (! $email) {
                return back()->with('error', 'No email address found for this estate.');
            }

            Mail::to($email)->send(new SendInvoiceMail($invoice));

            // Update last sent timestamp
            $invoice->update(['last_sent_email_at' => now()]);

            return redirect()->route('admin.billing.invoices.show', $invoice->id)
                ->with('success', "Invoice {$invoice->invoice_number} sent to {$email}");
        } catch (\Exception $e) {
            \Log::error('Failed to send invoice email', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to send invoice email. Please try again.');
        }
    }

    /**
     * Manually confirm and verify payment if callback fails.
     */
    public function confirmPayment(Invoice $invoice): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);
        abort_if($invoice->estate_id !== $estate->id, 404);
        abort_if(! $invoice->isPending(), 422, 'Only pending invoices can be confirmed.');

        try {
            // Get the most recent payment transaction
            $transaction = $invoice->paymentTransactions()->first();

            if (! $transaction) {
                return back()->with('error', 'No payment transaction found for this invoice.');
            }

            if (! $transaction->paystack_reference) {
                return back()->with('error', 'No Paystack reference found. Please initiate payment first.');
            }

            // Verify the payment with Paystack
            $verification = $this->paystackService->verifyPayment($transaction->paystack_reference);

            if ($verification['status'] !== 'success') {
                return back()->with('error', 'Payment verification failed. The payment may not have been completed.');
            }

            // Record the payment
            $verificationService = app(PaymentVerificationService::class);
            $verificationService->verifyAndRecordPayment(
                $transaction->paystack_reference,
                $invoice,
                $transaction->idempotency_key
            );

            return redirect()->route('admin.billing.invoices.show', $invoice->id)
                ->with('success', 'Payment confirmed and recorded successfully!');
        } catch (\Exception $e) {
            \Log::error('Manual payment confirmation failed', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Error confirming payment: '.$e->getMessage());
        }
    }
}
