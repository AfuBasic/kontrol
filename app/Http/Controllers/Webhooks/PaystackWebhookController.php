<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\CollectionAssignment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PropertyOwner\CollectionPaymentReceivedNotification;
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
                            app(ContextManager::class)->setSystemContext($payment->estate_id);
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

                                    $assignment->loadMissing('collection.creator');
                                    $creator = $assignment->collection?->creator;
                                    if ($creator && $creator->getRoleNameForEstate($assignment->estate_id) === 'property_owner') {
                                        $creator->notify(new CollectionPaymentReceivedNotification($assignment, $payment->amount));
                                    } else {
                                        $adminIds = AdministrativeAssignment::where('estate_id', $assignment->estate_id)
                                            ->where('is_active', true)
                                            ->whereHas('role', fn ($q) => $q->where('name', 'admin'))
                                            ->pluck('user_id')
                                            ->toArray();

                                        $admins = User::whereIn('id', $adminIds)->get();

                                        foreach ($admins as $admin) {
                                            $admin->notify(new CollectionPaymentReceivedNotification($assignment, $payment->amount));
                                        }
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
                                            'reference' => $reference.'-'.$assignment->id,
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

                                        $assignment->loadMissing('collection.creator');
                                        $creator = $assignment->collection?->creator;
                                        if ($creator && $creator->getRoleNameForEstate($assignment->estate_id) === 'property_owner') {
                                            $creator->notify(new CollectionPaymentReceivedNotification($assignment, $due));
                                        } else {
                                            $adminIds = AdministrativeAssignment::where('estate_id', $assignment->estate_id)
                                                ->where('is_active', true)
                                                ->whereHas('role', fn ($q) => $q->where('name', 'admin'))
                                                ->pluck('user_id')
                                                ->toArray();

                                            $admins = User::whereIn('id', $adminIds)->get();

                                            foreach ($admins as $admin) {
                                                $admin->notify(new CollectionPaymentReceivedNotification($assignment, $due));
                                            }
                                        }
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
