<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Billing\RecordPaymentAction;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Services\PaystackService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PaymentCallbackController extends Controller
{
    public function __invoke(
        Request $request,
        PaystackService $paystackService,
        RecordPaymentAction $recordPaymentAction,
    ): RedirectResponse {
        $reference = $request->query('reference');

        if (! $reference) {
            return redirect()->route('admin.billing.invoices.index')
                ->with('error', 'No payment reference provided.');
        }

        $invoice = null;

        try {
            // Verify payment with Paystack
            $verification = $paystackService->verifyPayment($reference);

            if ($verification['status'] !== 'success') {
                return redirect()->route('admin.billing.invoices.index')
                    ->with('error', 'Payment verification failed. Please try again.');
            }

            // Find invoice via payment transaction (handles suffixed references like KTRL-xxx_1)
            $transaction = PaymentTransaction::where('paystack_reference', $verification['reference'])->firstOrFail();
            $invoice = $transaction->invoice;

            // Record payment with comprehensive safety checks
            // This handles idempotency, double-payment prevention, and atomic transactions
            $recordPaymentAction->execute(
                $invoice,
                $reference,  // Paystack reference
                $request->header('Idempotency-Key')  // Optional idempotency key
            );

            return redirect()->route('admin.billing.invoices.show', $invoice->id)
                ->with('success', 'Payment recorded successfully!');
        } catch (\Exception $e) {
            // Log payment error for investigation
            $log = activity()
                ->withProperties([
                    'reference' => $reference,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

            if ($invoice) {
                $log->on($invoice->estate);
            }

            $log->log('Payment callback processing failed');

            return redirect()->route('admin.billing.invoices.index')
                ->with('error', 'Error processing payment: '.$e->getMessage());
        }
    }
}
