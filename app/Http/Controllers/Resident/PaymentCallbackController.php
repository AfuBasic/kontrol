<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Billing\RecordPaymentAction;
use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Services\Billing\PaymentVerificationService;
use App\Services\PaystackService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PaymentCallbackController extends Controller
{
    public function __invoke(
        Request $request,
        PaystackService $paystackService,
        RecordPaymentAction $recordPaymentAction,
        PaymentVerificationService $verificationService,
    ): RedirectResponse {
        $reference = $request->query('reference');

        if (! $reference) {
            return redirect()->route('resident.billing.index')
                ->with('error', 'No payment reference provided.');
        }

        try {
            $transaction = PaymentTransaction::where('paystack_reference', $reference)->first();

            if (! $transaction) {
                return redirect()->route('resident.billing.index')
                    ->with('error', 'Transaction not found.');
            }

            // Handle Card Setup
            if (($transaction->metadata['type'] ?? null) === 'card_setup') {
                $verificationService->verifyAndRecordCardSetup($reference);

                return redirect()->route('resident.billing.index')
                    ->with('success', 'Card successfully added and NGN 50 refund processed!');
            }

            // Handle Invoice Payment
            $invoice = $transaction->invoice;
            abort_if($invoice->user_id !== auth()->id(), 404);

            $recordPaymentAction->execute(
                $invoice,
                $reference,
                $request->header('Idempotency-Key'),
            );

            return redirect()->route('resident.billing.index')
                ->with('success', 'Payment recorded successfully!');
        } catch (\Exception $e) {
            activity()->withProperties([
                'reference' => $reference,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ])->log('Resident payment callback processing failed');

            return redirect()->route('resident.billing.index')
                ->with('error', 'Error processing payment: '.$e->getMessage());
        }
    }
}
