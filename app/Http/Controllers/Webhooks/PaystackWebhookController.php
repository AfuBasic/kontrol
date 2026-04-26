<?php

namespace App\Http\Controllers\Webhooks;

use App\Actions\Billing\RecordPaymentAction;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\Billing\BillingFinalizationService;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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
                    // Strip the -AUTO-XXXX-XX-XX suffix if it exists
                    $cleanReference = preg_replace('/-AUTO-\d{4}-\d{2}-\d{2}$/', '', $reference);
                    $invoice = Invoice::where('invoice_number', $cleanReference)->first();

                    if ($invoice && ! $invoice->isPaid()) {
                        $finalizationService->finalizeSuccess($invoice, [
                            'reference' => $reference,
                            'payment_method' => $data['channel'] ?? 'card',
                            'customer_email' => $data['customer']['email'] ?? null,
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error("Webhook processing error for reference {$reference}: " . $e->getMessage());
                }
            }
        }

        return response('OK', 200);
    }
}
