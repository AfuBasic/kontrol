<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\SendInvoiceMail;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Services\Admin\BillingService;
use App\Services\Billing\InvoiceGenerationService;
use App\Services\Billing\PaymentVerificationService;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

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

        return Inertia::render('admin/billing/invoices', [
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
            'invoice_number' => $invoice->invoice_number,
            'amount' => $invoice->amount,
            'status' => $invoice->status,
            'due_date' => $invoice->due_date?->toDateString(),
            'created_at' => $invoice->created_at?->toDateString(),
        ]);

        return Inertia::render('admin/billing/invoice-detail', [
            'invoice' => $invoice->load(['plan', 'paymentTransactions']),
        ]);
    }

    public function show(Invoice $invoice): Response
    {
        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);
        abort_if($invoice->estate_id !== $estate->id, 404);

        return Inertia::render('admin/billing/invoice-detail', [
            'invoice' => $invoice->load(['plan', 'paymentTransactions']),
        ]);
    }

    public function pay(Invoice $invoice): RedirectResponse
    {
        \Log::info('InvoiceController::pay() called', ['invoice_id' => $invoice->id]);

        $estate = $this->estateContext->getEstate();

        abort_if($estate->settings->charge_type !== 'estate', 403);
        abort_if($invoice->estate_id !== $estate->id, 404);
        abort_if($invoice->isPaid(), 422, 'Invoice is already paid.');

        try {
            \Log::info('Payment flow: checking existing transactions');
            // Check if there's already a pending/initiated payment for this invoice
            $existingTransaction = PaymentTransaction::where('invoice_id', $invoice->id)
                ->whereIn('status', ['pending', 'success'])
                ->latest()
                ->first();

            \Log::info('Payment flow: checked existing transactions', ['found' => $existingTransaction ? true : false]);

            // If there's a successful transaction that hasn't been recorded, verify it
            if ($existingTransaction && $existingTransaction->status === 'success' && ! $existingTransaction->recorded_at) {
                \Log::info('Payment flow: verifying unrecorded successful transaction');
                $verificationService = app(PaymentVerificationService::class);
                $verificationService->verifyAndRecordPayment(
                    $existingTransaction->paystack_reference,
                    $invoice,
                    $existingTransaction->idempotency_key
                );

                return redirect()->route('admin.billing.invoices.show', $invoice->id)
                    ->with('success', 'Payment verified and recorded!');
            }

            // If there's a pending transaction, reuse its Paystack reference
            if ($existingTransaction && $existingTransaction->status === 'pending') {
                \Log::info('Payment flow: reusing pending transaction');

                return redirect($existingTransaction->metadata['authorization_url'] ?? route('admin.billing.invoices.show', $invoice->id))
                    ->with('info', 'Returning to existing payment checkout. Please complete the payment.');
            }

            \Log::info('Payment flow: creating new transaction', [
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
            ]);

            // Create a new pending payment transaction
            $transaction = PaymentTransaction::create([
                'invoice_id' => $invoice->id,
                'estate_id' => $estate->id,
                'paystack_reference' => $invoice->invoice_number,
                'idempotency_key' => (string) Str::uuid(),
                'amount' => $invoice->amount,
                'currency' => 'NGN',
                'status' => 'pending',
                'attempt_count' => 1,
            ]);

            \Log::info('Payment flow: transaction created', ['transaction_id' => $transaction->id]);

            // Initialize payment with Paystack using invoice number as reference
            $paymentData = $this->paystackService->initializePayment(
                $invoice,
                route('admin.billing.payment.callback')
            );

            // Update transaction with Paystack data
            $transaction->update([
                'paystack_reference' => $paymentData['reference'],
                'metadata' => [
                    'access_code' => $paymentData['access_code'],
                    'authorization_url' => $paymentData['authorization_url'],
                ],
            ]);

            // Save access code for later
            $invoice->update(['paystack_access_code' => $paymentData['access_code']]);

            return redirect($paymentData['authorization_url']);
        } catch (\Exception $e) {
            $errorData = json_decode($e->getMessage(), true);

            if (($errorData['code'] ?? '') === 'duplicate_reference' && isset($transaction)) {
                $result = $this->handleDuplicateReference($invoice, $transaction);
                if ($result !== null) {
                    return $result;
                }
            }

            // Clean transaction on unrecoverable errors only
            if (isset($transaction) && $transaction->exists) {
                $transaction->delete();
            }

            return $this->handlePaymentError($e);
        }
    }

    /**
     * Handle duplicate reference errors by verifying existing payment or retrying with a new reference.
     */
    private function handleDuplicateReference(Invoice $invoice, PaymentTransaction $transaction): ?RedirectResponse
    {
        $verificationService = app(\App\Services\Billing\PaymentVerificationService::class);
        $maxRetries = PaymentVerificationService::MAX_RETRY_ATTEMPTS;

        try {
            // Step 1: Verify the original reference first
            $verification = $this->paystackService->verifyPayment($invoice->invoice_number);

            if ($verification['status'] === 'success') {
                // Payment already went through — record it and mark invoice paid
                $verificationService->verifyAndRecordPayment(
                    $invoice->invoice_number,
                    $invoice,
                    null
                );

                return redirect()
                    ->route('admin.billing.invoices.show', $invoice->id)
                    ->with('success', 'Payment verified and recorded successfully!');
            }
        } catch (\Exception) {
            // Verification failed — proceed to retry with new reference
        }

        // Step 2: Guard max retries
        if ($transaction->attempt_count >= $maxRetries) {
            $transaction->delete();

            return back()->with('error',
                'Too many payment attempts for this invoice. Please contact support.'
            );
        }

        // Step 3: Increment attempt count and build suffix reference
        $transaction->increment('attempt_count');
        $transaction->refresh();
        $newReference = $invoice->invoice_number.'_'.$transaction->attempt_count;

        try {
            $paymentData = $this->paystackService->initializePayment(
                $invoice,
                route('admin.billing.payment.callback'),
                $newReference
            );

            // Update transaction with new reference and metadata
            $transaction->update([
                'paystack_reference' => $paymentData['reference'],
                'metadata' => [
                    'access_code' => $paymentData['access_code'],
                    'authorization_url' => $paymentData['authorization_url'],
                    'original_reference' => $invoice->invoice_number,
                ],
            ]);

            $invoice->update(['paystack_access_code' => $paymentData['access_code']]);

            return redirect($paymentData['authorization_url']);
        } catch (\Exception) {
            // Let the caller handle it
            return null;
        }
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

    /**
     * Handle payment initialization errors with user-friendly messages.
     */
    private function handlePaymentError(\Exception $e): RedirectResponse
    {
        try {
            $errorData = json_decode($e->getMessage(), true);
            $errorCode = $errorData['code'] ?? 'unknown';
            $errorMessage = $errorData['message'] ?? 'Payment initialization failed';
        } catch (\Exception) {
            return back()->with('error', 'An unexpected error occurred. Please try again.');
        }

        // Map Paystack error codes to user-friendly messages
        $userMessages = [
            'invalid_reference' => 'Invalid invoice reference. Please try again.',
            'invalid_amount' => 'Invalid invoice amount. Please contact support.',
            'authentication_failed' => 'Payment gateway authentication failed. Please try again.',
            'rate_limit' => 'Too many payment attempts. Please wait a moment and try again.',
            'network_error' => 'Network connection error. Please check your internet and try again.',
            'timeout' => 'Payment service timeout. Please try again.',
        ];

        $message = $userMessages[$errorCode] ?? 'Failed to initialize payment. Please try again or contact support.';

        // Log for debugging
        \Log::warning('Payment initialization error', [
            'code' => $errorCode,
            'message' => $errorMessage,
            'user_message' => $message,
        ]);

        return back()->with('error', $message);
    }
}
