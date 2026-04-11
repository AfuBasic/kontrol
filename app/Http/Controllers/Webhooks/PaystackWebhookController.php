<?php

namespace App\Http\Controllers\Webhooks;

use App\Actions\Billing\RecordPaymentAction;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PaystackWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        PaystackService $paystackService,
        RecordPaymentAction $recordPaymentAction,
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
                    $invoice = Invoice::where('invoice_number', $reference)->first();

                    if ($invoice && ! $invoice->isPaid()) {
                        // Use idempotency key from request to prevent duplicate processing
                        $idempotencyKey = request()->header('X-Paystack-Webhook-ID') ?? 'webhook_'.$reference.'_'.$data['id'];

                        // Record payment with comprehensive safety checks
                        // This handles idempotency, preventing double-processing of webhook retries
                        $recordPaymentAction->execute(
                            $invoice,
                            $reference,
                            $idempotencyKey
                        );
                    }
                } catch (\Exception $e) {
                    // Log webhook processing error but still return 200
                    // Paystack will retry failed webhooks
                    if ($invoice) {
                        activity()
                            ->on($invoice->estate)
                            ->withProperties([
                                'event' => $event,
                                'reference' => $reference,
                                'error' => $e->getMessage(),
                            ])
                            ->log('Webhook payment processing failed');
                    }
                }
            }
        }

        return response('OK', 200);
    }
}
