<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Billing\RecordPaymentAction;
use App\Http\Controllers\Controller;
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
            return redirect()->route('resident.billing.index')
                ->with('error', 'No payment reference provided.');
        }

        $invoice = null;

        try {
            $verification = $paystackService->verifyPayment($reference);

            if ($verification['status'] !== 'success') {
                return redirect()->route('resident.billing.index')
                    ->with('error', 'Payment verification failed. Please try again.');
            }

            $transaction = PaymentTransaction::where('paystack_reference', $verification['reference'])->firstOrFail();
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
            $log = activity()->withProperties([
                'reference' => $reference,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            if ($invoice) {
                $log->on($invoice->estate);
            }

            $log->log('Resident payment callback processing failed');

            return redirect()->route('resident.billing.index')
                ->with('error', 'Error processing payment: '.$e->getMessage());
        }
    }
}
