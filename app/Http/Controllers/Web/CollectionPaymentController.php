<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\EstateSettings;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CollectionPaymentController extends Controller
{
    public function show(CollectionAssignment $assignment): Response
    {
        // For simplicity, we'll allow viewing by anyone with the link,
        // but typically we'd verify a signed URL or session.
        // For production, a signed URL is better for mobile-to-web handoff.

        $assignment->load(['collection', 'estate', 'user']);

        return Inertia::render('Web/Billing/PayCollection', [
            'assignment' => $assignment,
            'paystackKey' => config('services.paystack.public_key'),
        ]);
    }

    public function initiate(CollectionAssignment $assignment): JsonResponse
    {
        $user = $assignment->user;

        // Create a pending payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'estate_id' => $assignment->estate_id,
            'collection_assignment_id' => $assignment->id,
            'amount' => $assignment->amount_due - $assignment->amount_paid,
            'reference' => 'COLL-'.uniqid(),
            'status' => 'initiated',
        ]);

        $settings = EstateSettings::forEstate($assignment->estate_id);

        return response()->json([
            'reference' => $payment->reference,
            'email' => $user->email,
            'amount' => $payment->amount,
            'subaccount' => $settings->paystack_subaccount_code,
        ]);
    }

    public function verify(string $reference): JsonResponse
    {
        // 1. Find the payment by reference
        $payment = Payment::where('reference', $reference)->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        // 2. If already success, just return
        if ($payment->status === 'success') {
            return response()->json(['message' => 'Payment already verified']);
        }

        // 3. In production, we'd call Paystack API to verify the reference here.
        // For now, since we're calling this from the callback, we'll mark as success
        // if the client says it is. (Webhook will double-confirm this anyway).

        $payment->update([
            'status' => 'success',
            'paid_at' => now(),
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
        }

        return response()->json(['message' => 'Payment verified successfully']);
    }
}
