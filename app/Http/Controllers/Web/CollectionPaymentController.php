<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function initiate(CollectionAssignment $assignment, PaystackService $paystackService): JsonResponse
    {
        $user = $assignment->user;

        // 1. If assignment is already paid, return early
        if ($assignment->isPaid() || ($assignment->amount_due - $assignment->amount_paid) <= 0) {
            return response()->json([
                'already_paid' => true,
                'message' => 'Payment already completed.',
            ]);
        }

        // 2. Check all initiated/pending payments to see if any succeeded on Paystack
        $initiatedPayments = Payment::where('collection_assignment_id', $assignment->id)
            ->where('status', '!=', 'success')
            ->get();

        foreach ($initiatedPayments as $p) {
            try {
                // Verify status with Paystack
                $verification = $paystackService->verifyPayment($p->reference);

                if ($verification['status'] === 'success') {
                    DB::transaction(function () use ($p, $assignment) {
                        $lockedPayment = Payment::where('id', $p->id)->lockForUpdate()->first();
                        $lockedAssignment = CollectionAssignment::where('id', $assignment->id)->lockForUpdate()->first();

                        if ($lockedPayment && $lockedPayment->status !== 'success') {
                            $lockedPayment->update([
                                'status' => 'success',
                                'paid_at' => now(),
                            ]);

                            $lockedAssignment->increment('amount_paid', $lockedPayment->amount);
                            if ($lockedAssignment->amount_paid >= $lockedAssignment->amount_due) {
                                $lockedAssignment->update([
                                    'status' => 'paid',
                                    'paid_at' => now(),
                                    'external_reference' => $lockedPayment->reference,
                                ]);
                            } else {
                                $lockedAssignment->update(['status' => 'partial']);
                            }
                        }
                    });

                    return response()->json([
                        'already_paid' => true,
                        'message' => 'Payment already completed.',
                    ]);
                }
            } catch (\Exception $e) {
                // Ignore and check the next one
            }
        }

        // 3. Find the latest initiated payment to reuse for idempotency
        $existing = $initiatedPayments->sortByDesc('created_at')->first();

        if ($existing) {
            $payment = $existing;
        } else {
            // Generate a stable reference using assignment ULID and success count
            $successCount = Payment::where('collection_assignment_id', $assignment->id)
                ->where('status', 'success')
                ->count();

            $reference = 'COLL-'.$assignment->ulid.($successCount > 0 ? '-'.($successCount + 1) : '');

            // Create a new pending payment record
            $payment = Payment::create([
                'user_id' => $user->id,
                'estate_id' => $assignment->estate_id,
                'collection_assignment_id' => $assignment->id,
                'amount' => $assignment->amount_due - $assignment->amount_paid,
                'reference' => $reference,
                'status' => 'initiated',
            ]);
        }

        $settings = EstateSettings::forEstate($assignment->estate_id);

        return response()->json([
            'already_paid' => false,
            'reference' => $payment->reference,
            'email' => $user->email,
            'amount' => $payment->amount,
            'subaccount' => $settings->paystack_subaccount_code,
        ]);
    }

    public function verify(string $reference): JsonResponse
    {
        $result = DB::transaction(function () use ($reference) {
            // 1. Find the payment and lock it
            $payment = Payment::where('reference', $reference)->lockForUpdate()->first();

            if (! $payment) {
                return ['error' => 'Payment not found', 'status' => 404];
            }

            // 2. If already success, just return success
            if ($payment->status === 'success') {
                return ['message' => 'Payment already verified', 'status' => 200];
            }

            // Update payment to success
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
            ]);

            if ($payment->collection_assignment_id) {
                $assignment = CollectionAssignment::where('id', $payment->collection_assignment_id)->lockForUpdate()->first();
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
            } elseif ($payment->raw_payload && isset($payment->raw_payload['assignment_ids'])) {
                $assignmentIds = $payment->raw_payload['assignment_ids'];
                $assignments = CollectionAssignment::whereIn('id', $assignmentIds)->lockForUpdate()->get();
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

            return ['message' => 'Payment verified successfully', 'status' => 200];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json(['message' => $result['message']], $result['status']);
    }

    public function showBulk(Request $request): Response
    {
        $ulids = explode(',', $request->query('assignments', ''));
        $assignments = CollectionAssignment::whereIn('ulid', $ulids)
            ->with(['collection', 'estate', 'user'])
            ->get();

        abort_if($assignments->isEmpty(), 404, 'No outstanding bills found.');

        $first = $assignments->first();
        foreach ($assignments as $a) {
            if ($a->user_id !== $first->user_id || $a->estate_id !== $first->estate_id) {
                abort(400, 'All selected dues must belong to the same resident and estate.');
            }
        }

        return Inertia::render('Web/Billing/PayCollectionBulk', [
            'assignments' => $assignments,
            'paystackKey' => config('services.paystack.public_key'),
            'totalAmount' => $assignments->sum(fn ($a) => max(0, $a->amount_due - $a->amount_paid)),
        ]);
    }

    public function initiateBulk(Request $request, PaystackService $paystackService): JsonResponse
    {
        $ulids = explode(',', $request->input('assignments', ''));
        $assignments = CollectionAssignment::whereIn('ulid', $ulids)
            ->with(['user', 'estate'])
            ->get();

        if ($assignments->isEmpty()) {
            return response()->json(['message' => 'No dues found.'], 404);
        }

        $first = $assignments->first();
        $user = $first->user;
        $estateId = $first->estate_id;

        foreach ($assignments as $a) {
            if ($a->user_id !== $user->id || $a->estate_id !== $estateId) {
                return response()->json(['message' => 'Mismatch in resident or estate context.'], 400);
            }
        }

        $unpaidAssignments = $assignments->filter(fn ($a) => ! $a->isPaid() && ($a->amount_due - $a->amount_paid) > 0);

        if ($unpaidAssignments->isEmpty()) {
            return response()->json([
                'already_paid' => true,
                'message' => 'All selected bills are already settled.',
            ]);
        }

        $totalAmount = $unpaidAssignments->sum(fn ($a) => $a->amount_due - $a->amount_paid);
        $assignmentIds = $unpaidAssignments->pluck('id')->sort()->values()->toArray();

        $existing = Payment::where('user_id', $user->id)
            ->where('estate_id', $estateId)
            ->whereNull('collection_assignment_id')
            ->where('status', 'initiated')
            ->get()
            ->first(function ($p) use ($assignmentIds) {
                $payloadIds = data_get($p->raw_payload, 'assignment_ids', []);
                sort($payloadIds);

                return $payloadIds === $assignmentIds;
            });

        if ($existing) {
            $payment = $existing;
        } else {
            // Must start with COLL- to trigger webhook match condition
            $reference = 'COLL-BULK-'.strtoupper(bin2hex(random_bytes(8)));

            $payment = Payment::create([
                'user_id' => $user->id,
                'estate_id' => $estateId,
                'collection_assignment_id' => null,
                'amount' => $totalAmount,
                'reference' => $reference,
                'status' => 'initiated',
                'raw_payload' => [
                    'assignment_ids' => $assignmentIds,
                    'is_bulk' => true,
                ],
            ]);
        }

        $settings = EstateSettings::forEstate($estateId);

        return response()->json([
            'already_paid' => false,
            'reference' => $payment->reference,
            'email' => $user->email,
            'amount' => $payment->amount,
            'subaccount' => $settings->paystack_subaccount_code,
        ]);
    }
}
