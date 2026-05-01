<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
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

        return response()->json([
            'reference' => $payment->reference,
            'email' => $user->email,
            'amount' => $payment->amount,
        ]);
    }
}
