<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Billing\BillingFinalizationService;
use App\Services\Billing\CollectionPaymentSettler;
use App\Services\PaystackService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PaystackWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        PaystackService $paystackService,
        BillingFinalizationService $finalizationService,
    ): Response {
        $payload = $request->getContent();
        $signature = $request->header('X-Paystack-Signature');

        // Validate webhook signature
        if (! $paystackService->validateWebhookSignature($payload, $signature)) {
            return response('Unauthorized', 401);
        }

        $event = $request->json('event');
        $data = $request->json('data');

        // Handle charge.success event
        if ($event === 'charge.success') {
            $reference = $data['reference'] ?? null;

            if ($reference) {
                try {
                    if (str_starts_with($reference, 'COLL-')) {
                        // Defense-in-depth: Ensure collections are ONLY paid via bank transfer
                        if (isset($data['channel']) && $data['channel'] !== 'bank_transfer') {
                            Log::error("Security violation: Collection payment attempted with restricted channel. Ref={$reference}, Channel={$data['channel']}");

                            return response('OK', 200); // Return 200 so Paystack doesn't retry, but DO NOT grant value
                        }

                        // The signature above proves Paystack sent this. The settler locks the payment and credits
                        // the charge exactly once, however many times this webhook (or the status page) fires.
                        app(CollectionPaymentSettler::class)->settle($reference);
                    } else {
                        // Existing invoice logic
                        // Strip the -AUTO-XXXX-XX-XX suffix if it exists
                        $cleanReference = preg_replace('/-AUTO-\d{4}-\d{2}-\d{2}$/', '', $reference);
                        $invoice = Invoice::where('invoice_number', $cleanReference)->first();

                        if ($invoice && ! $invoice->isPaid()) {
                            $finalizationService->finalizeSuccess($invoice, [
                                'reference' => $reference,
                                'payment_method' => $data['channel'] ?? 'card',
                                'customer_email' => $data['customer']['email'] ?? null,
                                'authorization' => $data['authorization'] ?? null,
                                'customer' => $data['customer'] ?? null,
                            ]);
                        }
                    }
                } catch (Exception $e) {
                    Log::error("Webhook processing error for reference {$reference}: ".$e->getMessage());
                }
            }
        }

        return response('OK', 200);
    }
}
