<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Billing\BillingFinalizationService;
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
                        $payment = Payment::where('reference', $reference)->first();
                        if ($payment && $payment->status !== 'success') {
                            $assignmentIds = data_get($payment->raw_payload, 'assignment_ids');

                            $payment->update([
                                'status' => 'success',
                                'paid_at' => now(),
                                'raw_payload' => array_merge($payment->raw_payload ?? [], ['paystack_data' => $data]),
                            ]);

                            if ($payment->collection_assignment_id) {
                                $assignment = CollectionAssignment::find($payment->collection_assignment_id);
                                if ($assignment) {
                                    $assignment->increment('amount_paid', $payment->amount);
                                    if ($assignment->amount_paid >= $assignment->amount_due) {
                                        $assignment->update([
                                            'status' => 'paid',
                                            'paid_at' => now(),
                                            'external_reference' => $reference,
                                        ]);
                                    } else {
                                        $assignment->update(['status' => 'partial']);
                                    }
                                }
                            } elseif ($assignmentIds) {
                                $assignments = CollectionAssignment::whereIn('id', $assignmentIds)->get();
                                foreach ($assignments as $assignment) {
                                    $due = $assignment->amount_due - $assignment->amount_paid;
                                    if ($due > 0) {
                                        Payment::create([
                                            'user_id' => $payment->user_id,
                                            'estate_id' => $payment->estate_id,
                                            'collection_assignment_id' => $assignment->id,
                                            'amount' => $due,
                                            'reference' => $reference,
                                            'status' => 'success',
                                            'paid_at' => now(),
                                            'raw_payload' => ['bulk_parent_reference' => $reference],
                                        ]);

                                        $assignment->increment('amount_paid', $due);
                                        $assignment->update([
                                            'status' => 'paid',
                                            'paid_at' => now(),
                                            'external_reference' => $reference,
                                        ]);
                                    }
                                }
                            }
                        }
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
