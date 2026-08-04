<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Notifications\PropertyOwner\CollectionPaymentReceivedNotification;
use App\Services\Compliance\ComplianceEngine;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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

        $baseAmount = max(0, $assignment->amount_due - $assignment->amount_paid);
        $hasActiveSubscription = $this->hasActiveSubscription($assignment->user_id);

        $fees = $this->calculateFees($baseAmount, $hasActiveSubscription);

        return Inertia::render('Web/Billing/PayCollection', [
            'assignment' => $assignment,
            'paystackKey' => config('services.paystack.public_key'),
            'feeBreakdown' => $fees,
            'hasSubscription' => $hasActiveSubscription,
        ]);
    }

    public function initiate(CollectionAssignment $assignment, PaystackService $paystackService, Request $request): JsonResponse
    {
        setPermissionsTeamId($assignment->estate_id);
        $assignment->loadMissing(['user', 'collection.creator.profile']);
        $user = $assignment->user;

        $remainingBalance = max(0, $assignment->amount_due - $assignment->amount_paid);

        // 1. If assignment is already paid, return early
        if ($assignment->isPaid() || $remainingBalance <= 0) {
            return response()->json([
                'already_paid' => true,
                'message' => 'Payment already completed.',
            ]);
        }

        // Validate custom partial amount if provided by resident (frontend sends kobo, convert to NGN/kobo units)
        $customAmount = $request->input('amount'); // amount in kobo or NGN
        $paymentAmount = $remainingBalance;

        if (! empty($customAmount)) {
            $customAmountInt = (int) $customAmount;
            // If custom amount sent in kobo is larger than remaining balance in NGN, convert kobo to NGN (or vice-versa)
            // Note: $remainingBalance in model is in kobo (e.g. 5000000 = 50,000 NGN)
            if ($customAmountInt > 0 && $customAmountInt <= $assignment->amount_due) {
                // If frontend sends kobo (e.g. 2000000 for NGN 20,000)
                if ($customAmountInt <= $remainingBalance) {
                    $paymentAmount = $customAmountInt;
                } else {
                    // Fallback if sent in NGN
                    $paymentAmount = min($remainingBalance, $customAmountInt * 100);
                }
            }
        }

        // 2. Resolve subaccount & check configuration
        $subaccount = $this->resolveSubaccount($assignment);
        if (empty($subaccount)) {
            $collection = $assignment->collection;
            $creator = $collection->creator;
            if ($creator && $creator->hasRole('property_owner')) {
                return response()->json([
                    'message' => 'Landlord has not configured their settlement account. Please contact your landlord to set up banking details.',
                ], 400);
            }

            return response()->json([
                'message' => 'Estate has not configured its settlement account. Please contact the estate administrator.',
            ], 400);
        }

        // 3. Check all initiated/pending payments with Paystack
        $initiatedPayments = Payment::where('collection_assignment_id', $assignment->id)
            ->where('status', '!=', 'success')
            ->orderByDesc('created_at')
            ->get();

        foreach ($initiatedPayments as $p) {
            try {
                // Verify status with Paystack
                $verification = $paystackService->verifyPayment($p->reference);
                $status = $verification['status'] ?? null;

                if ($status === 'success') {
                    DB::transaction(function () use ($p, $assignment) {
                        $lockedPayment = Payment::where('id', $p->id)->lockForUpdate()->first();
                        $lockedAssignment = CollectionAssignment::where('id', $assignment->id)->lockForUpdate()->first();

                        if ($lockedPayment && $lockedPayment->status !== 'success') {
                            $lockedPayment->update([
                                'status' => 'success',
                                'paid_at' => now(),
                            ]);

                            $lockedAssignment->increment('amount_paid', $lockedPayment->amount);
                            $feeToRecord = $this->hasActiveSubscription($lockedPayment->user_id) ? 0 : $lockedPayment->amount * 0.005;
                            $lockedAssignment->increment('kontrol_fee_paid', $feeToRecord);
                            if ($lockedAssignment->amount_paid >= $lockedAssignment->amount_due) {
                                $lockedAssignment->update([
                                    'status' => 'paid',
                                    'paid_at' => now(),
                                    'external_reference' => $lockedPayment->reference,
                                ]);
                            } else {
                                $lockedAssignment->update(['status' => 'partial']);
                            }

                            $lockedAssignment->loadMissing('collection.creator');
                            $creator = $lockedAssignment->collection?->creator;
                            if ($creator && $creator->hasRole('property_owner')) {
                                $creator->notify(new CollectionPaymentReceivedNotification($lockedAssignment, $lockedPayment->amount));
                            } else {
                                $admins = User::role('admin')
                                    ->whereHas('estates', function ($query) use ($lockedAssignment) {
                                        $query->where('estates.id', $lockedAssignment->estate_id);
                                    })
                                    ->get();

                                foreach ($admins as $admin) {
                                    $admin->notify(new CollectionPaymentReceivedNotification($lockedAssignment, $lockedPayment->amount));
                                }
                            }
                        }
                    });

                    return response()->json([
                        'already_paid' => true,
                        'message' => 'Payment already completed.',
                    ]);
                } elseif (in_array($status, ['ongoing', 'pending', 'processing'])) {
                    return response()->json([
                        'message' => 'Your previous payment attempt is currently pending confirmation from Paystack. Please wait a few moments or check back later.',
                    ], 400);
                } elseif (in_array($status, ['failed', 'abandoned', 'reversed'])) {
                    $p->update(['status' => 'failed']);
                }
            } catch (\Exception $e) {
                // Ignore verification errors if reference was never submitted to Paystack
            }
        }

        // 4. Generate a NEW UNIQUE payment record for this attempt
        $totalAttempts = Payment::where('collection_assignment_id', $assignment->id)->count();
        $suffix = '-a'.($totalAttempts + 1).'-'.Str::random(4);
        $reference = 'COLL-'.$assignment->ulid.$suffix;

        $payment = Payment::create([
            'user_id' => $user->id,
            'estate_id' => $assignment->estate_id,
            'collection_assignment_id' => $assignment->id,
            'amount' => $paymentAmount,
            'reference' => $reference,
            'status' => 'initiated',
        ]);

        // 5. Calculate Exact Fees for Exact Split
        $baseAmount = $payment->amount;
        $hasActiveSubscription = $this->hasActiveSubscription($user->id);

        $fees = $this->calculateFees($baseAmount, $hasActiveSubscription);

        return response()->json([
            'already_paid' => false,
            'reference' => $payment->reference,
            'email' => $user->email,
            'amount' => $fees['total_amount'], // Pass the total charged amount to frontend
            'base_amount' => $baseAmount,
            'kontrol_fee' => $fees['kontrol_fee'],
            'paystack_fee' => $fees['paystack_fee'],
            'subaccount' => $subaccount,
            'bearer' => 'account', // Kontrol bears the Paystack charge
            'transaction_charge' => $fees['transaction_charge'], // Exact flat amount for Kontrol to keep
        ]);
    }

    public function verify(string $reference): JsonResponse
    {
        Log::info("Paystack Verification Endpoint Hit: Ref={$reference}");
        $result = DB::transaction(function () use ($reference) {
            // 1. Find the payment and lock it
            $payment = Payment::where('reference', $reference)->lockForUpdate()->first();

            if (! $payment) {
                Log::warning("Paystack Verification failed: Payment not found for Ref={$reference}");

                return ['error' => 'Payment not found', 'status' => 404];
            }

            setPermissionsTeamId($payment->estate_id);

            // 2. If already success, just return success
            if ($payment->status === 'success') {
                Log::info("Paystack Verification: Already success for Ref={$reference}");

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
                    $feeToRecord = $this->hasActiveSubscription($payment->user_id) ? 0 : $payment->amount * 0.005;
                    $assignment->increment('kontrol_fee_paid', $feeToRecord);
                    if ($assignment->amount_paid >= $assignment->amount_due) {
                        $assignment->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                            'external_reference' => $reference,
                        ]);
                        app(ComplianceEngine::class)->resolveCompliance($assignment, 'Paid in Full');
                    } else {
                        $assignment->update(['status' => 'partial']);
                        // Re-evaluate compliance for partial payment balance reduction
                        app(ComplianceEngine::class)->raiseViolation($assignment);
                    }

                    $assignment->loadMissing('collection.creator');
                    $creator = $assignment->collection?->creator;
                    if ($creator && $creator->hasRole('property_owner')) {
                        $creator->notify(new CollectionPaymentReceivedNotification($assignment, $payment->amount));
                    } else {
                        $admins = User::role('admin')
                            ->whereHas('estates', function ($query) use ($assignment) {
                                $query->where('estates.id', $assignment->estate_id);
                            })
                            ->get();

                        foreach ($admins as $admin) {
                            $admin->notify(new CollectionPaymentReceivedNotification($assignment, $payment->amount));
                        }
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
                            'reference' => $reference.'-'.$assignment->id,
                            'status' => 'success',
                            'paid_at' => now(),
                            'raw_payload' => ['bulk_parent_reference' => $reference],
                        ]);

                        $assignment->increment('amount_paid', $due);
                        $feeToRecord = $this->hasActiveSubscription($payment->user_id) ? 0 : $due * 0.005;
                        $assignment->increment('kontrol_fee_paid', $feeToRecord);
                        $assignment->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                            'external_reference' => $reference,
                        ]);

                        $assignment->loadMissing('collection.creator');
                        $creator = $assignment->collection?->creator;
                        if ($creator && $creator->hasRole('property_owner')) {
                            $creator->notify(new CollectionPaymentReceivedNotification($assignment, $due));
                        } else {
                            $admins = User::role('admin')
                                ->whereHas('estates', function ($query) use ($assignment) {
                                    $query->where('estates.id', $assignment->estate_id);
                                })
                                ->get();

                            foreach ($admins as $admin) {
                                $admin->notify(new CollectionPaymentReceivedNotification($assignment, $due));
                            }
                        }
                    }
                }
            }

            Log::info("Paystack Verification completed successfully for Ref={$reference}");

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
            ->with(['collection.creator.profile', 'estate', 'user'])
            ->get();

        abort_if($assignments->isEmpty(), 404, 'No outstanding bills found.');

        $first = $assignments->first();
        setPermissionsTeamId($first->estate_id);
        $firstSubaccount = $this->resolveSubaccount($first);

        if (empty($firstSubaccount)) {
            $collection = $first->collection;
            $creator = $collection->creator;
            if ($creator && $creator->hasRole('property_owner')) {
                abort(400, 'Landlord settlement account is not configured. Please contact the landlord.');
            }
            abort(400, 'Estate settlement account is not configured.');
        }

        foreach ($assignments as $a) {
            if ($a->user_id !== $first->user_id || $a->estate_id !== $first->estate_id) {
                abort(400, 'All selected dues must belong to the same resident and estate.');
            }

            $currentSubaccount = $this->resolveSubaccount($a);

            if (empty($currentSubaccount)) {
                $collection = $a->collection;
                $creator = $collection->creator;
                if ($creator && $creator->hasRole('property_owner')) {
                    abort(400, 'Landlord settlement account is not configured. Please contact the landlord.');
                }
                abort(400, 'Estate settlement account is not configured.');
            }

            if ($currentSubaccount !== $firstSubaccount) {
                abort(400, 'All selected bills must be routed to the same settlement account. You cannot mix estate and landlord bills or bills from different landlords.');
            }
        }

        $totalBaseAmount = $assignments->sum(fn ($a) => max(0, $a->amount_due - $a->amount_paid));
        $hasActiveSubscription = $this->hasActiveSubscription($first->user_id);

        $fees = $this->calculateFees($totalBaseAmount, $hasActiveSubscription);

        return Inertia::render('Web/Billing/PayCollectionBulk', [
            'assignments' => $assignments,
            'paystackKey' => config('services.paystack.public_key'),
            'totalAmount' => $totalBaseAmount,
            'feeBreakdown' => $fees,
            'hasSubscription' => $hasActiveSubscription,
        ]);
    }

    public function initiateBulk(Request $request, PaystackService $paystackService): JsonResponse
    {
        $ulids = explode(',', $request->input('assignments', ''));
        $assignments = CollectionAssignment::whereIn('ulid', $ulids)
            ->with(['user', 'estate', 'collection.creator.profile'])
            ->get();

        if ($assignments->isEmpty()) {
            return response()->json(['message' => 'No dues found.'], 404);
        }

        $first = $assignments->first();
        setPermissionsTeamId($first->estate_id);
        $user = $first->user;
        $estateId = $first->estate_id;
        $firstSubaccount = $this->resolveSubaccount($first);

        if (empty($firstSubaccount)) {
            $collection = $first->collection;
            $creator = $collection->creator;
            if ($creator && $creator->hasRole('property_owner')) {
                return response()->json([
                    'message' => 'Landlord has not configured their settlement account. Please contact your landlord to set up banking details.',
                ], 400);
            }

            return response()->json([
                'message' => 'Estate has not configured its settlement account. Please contact the estate administrator.',
            ], 400);
        }

        foreach ($assignments as $a) {
            if ($a->user_id !== $user->id || $a->estate_id !== $estateId) {
                return response()->json(['message' => 'Mismatch in resident or estate context.'], 400);
            }

            $currentSubaccount = $this->resolveSubaccount($a);

            if (empty($currentSubaccount)) {
                $collection = $a->collection;
                $creator = $collection->creator;
                if ($creator && $creator->hasRole('property_owner')) {
                    return response()->json([
                        'message' => 'Landlord has not configured their settlement account. Please contact your landlord to set up banking details.',
                    ], 400);
                }

                return response()->json([
                    'message' => 'Estate has not configured its settlement account. Please contact the estate administrator.',
                ], 400);
            }

            if ($currentSubaccount !== $firstSubaccount) {
                return response()->json([
                    'message' => 'All selected bills must be routed to the same settlement account. You cannot mix estate and landlord bills or bills from different landlords.',
                ], 400);
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

        // Find all previous payment attempts for these assignments
        $previousPayments = Payment::where('user_id', $user->id)
            ->where('estate_id', $estateId)
            ->whereNull('collection_assignment_id')
            ->get()
            ->filter(function ($p) use ($assignmentIds) {
                $payloadIds = array_map('intval', data_get($p->raw_payload, 'assignment_ids', []));
                sort($payloadIds);

                return $payloadIds === $assignmentIds;
            });

        // 1. Check all non-success attempts to see if any succeeded on Paystack
        $initiatedPayments = $previousPayments->where('status', '!=', 'success')->sortByDesc('created_at');

        foreach ($initiatedPayments as $p) {
            try {
                $verification = $paystackService->verifyPayment($p->reference);
                $status = $verification['status'] ?? null;

                Log::info("Paystack Bulk Verification: Ref={$p->reference}, Status={$status}", [
                    'verification_response' => $verification,
                ]);

                if ($status === 'success') {
                    DB::transaction(function () use ($p, $unpaidAssignments) {
                        $lockedPayment = Payment::where('id', $p->id)->lockForUpdate()->first();

                        if ($lockedPayment && $lockedPayment->status !== 'success') {
                            $lockedPayment->update([
                                'status' => 'success',
                                'paid_at' => now(),
                            ]);

                            foreach ($unpaidAssignments as $assignment) {
                                $lockedAssignment = CollectionAssignment::where('id', $assignment->id)->lockForUpdate()->first();
                                if ($lockedAssignment) {
                                    $due = $lockedAssignment->amount_due - $lockedAssignment->amount_paid;
                                    if ($due > 0) {
                                        Payment::create([
                                            'user_id' => $lockedPayment->user_id,
                                            'estate_id' => $lockedPayment->estate_id,
                                            'collection_assignment_id' => $lockedAssignment->id,
                                            'amount' => $due,
                                            'reference' => $lockedPayment->reference.'-'.$lockedAssignment->id,
                                            'status' => 'success',
                                            'paid_at' => now(),
                                            'raw_payload' => ['bulk_parent_reference' => $lockedPayment->reference],
                                        ]);

                                        $lockedAssignment->increment('amount_paid', $due);
                                        $feeToRecord = $this->hasActiveSubscription($lockedPayment->user_id) ? 0 : $due * 0.005;
                                        $lockedAssignment->increment('kontrol_fee_paid', $feeToRecord);
                                        $lockedAssignment->update([
                                            'status' => 'paid',
                                            'paid_at' => now(),
                                            'external_reference' => $lockedPayment->reference,
                                        ]);

                                        $lockedAssignment->loadMissing('collection.creator');
                                        $creator = $lockedAssignment->collection ?? null ? $lockedAssignment->collection->creator : null;
                                        if ($creator && $creator->hasRole('property_owner')) {
                                            $creator->notify(new CollectionPaymentReceivedNotification($lockedAssignment, $due));
                                        } else {
                                            $admins = User::role('admin')
                                                ->whereHas('estates', function ($query) use ($lockedAssignment) {
                                                    $query->where('estates.id', $lockedAssignment->estate_id);
                                                })
                                                ->get();

                                            foreach ($admins as $admin) {
                                                $admin->notify(new CollectionPaymentReceivedNotification($lockedAssignment, $due));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });

                    return response()->json([
                        'already_paid' => true,
                        'message' => 'Payment already completed.',
                    ]);
                } elseif (in_array($status, ['ongoing', 'pending', 'processing'])) {
                    return response()->json([
                        'message' => 'You have a pending payment session for these bills. Please wait a few moments for confirmation or check back later.',
                    ], 400);
                } elseif (in_array($status, ['failed', 'abandoned'])) {
                    $p->update(['status' => 'failed']);
                }
            } catch (\Exception $e) {
                // If it fails verification because it doesn't exist on Paystack yet, we keep it as initiated
            }
        }

        // 2. Generate a new payment record with a unique attempt suffix to prevent reference collisions on Paystack
        $attemptsCount = $previousPayments->count();
        $suffix = $attemptsCount > 0 ? '-'.($attemptsCount + 1) : '';
        $reference = 'COLL-BULK-'.strtoupper(bin2hex(random_bytes(6))).$suffix;

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

        // 3. Calculate Exact Fees for Exact Split
        $baseAmount = $payment->amount;
        $hasActiveSubscription = $this->hasActiveSubscription($user->id);

        $fees = $this->calculateFees($baseAmount, $hasActiveSubscription);

        return response()->json([
            'already_paid' => false,
            'reference' => $payment->reference,
            'email' => $user->email,
            'amount' => $fees['total_amount'], // Pass the total charged amount to frontend
            'base_amount' => $baseAmount,
            'kontrol_fee' => $fees['kontrol_fee'],
            'paystack_fee' => $fees['paystack_fee'],
            'subaccount' => $firstSubaccount,
            'bearer' => 'account', // Kontrol bears the Paystack charge
            'transaction_charge' => $fees['transaction_charge'], // Exact flat amount for Kontrol to keep
        ]);
    }

    /**
     * Check if a user has an active, trial, or past_due subscription.
     */
    private function hasActiveSubscription(int $userId): bool
    {
        return ResidentSubscription::where('user_id', $userId)
            ->whereIn('status', ['active', 'trial', 'past_due'])
            ->where(function ($query) {
                $query->whereNull('current_period_end')
                    ->orWhere('current_period_end', '>=', now());
            })
            ->exists();
    }

    /**
     * Resolve the Paystack subaccount for a collection assignment.
     */
    private function resolveSubaccount(CollectionAssignment $assignment): ?string
    {
        $assignment->loadMissing(['collection.creator.profile']);
        $collection = $assignment->collection;
        $creator = $collection->creator;

        if ($creator && $creator->hasRole('property_owner')) {
            return $creator->profile?->paystack_subaccount_code;
        }

        $settings = EstateSettings::forEstate($assignment->estate_id);

        return $settings->paystack_subaccount_code;
    }

    /**
     * Calculate exact Kontrol and Paystack fees.
     */
    private function calculateFees(float $baseAmount, bool $hasActiveSubscription): array
    {
        $kontrolFee = $hasActiveSubscription ? 0 : round($baseAmount * 0.005, 2);

        $target = $baseAmount + $kontrolFee;

        // Guess total assuming < 2500 logic
        $total1 = $target / 0.985;

        // Guess total assuming >= 2500 logic
        $total2 = ($target + 100) / 0.985;

        if ($total1 < 2500) {
            $total = $total1;
            $paystackFee = $total * 0.015;
        } else {
            $total = $total2;
            $paystackFee = $total * 0.015 + 100;
        }

        // Apply Paystack cap
        if ($paystackFee > 2000) {
            $paystackFee = 2000;
            $total = $target + $paystackFee;
        }

        // Round strictly upward to ensure we don't lose a kobo to rounding issues
        $total = ceil($total * 100) / 100;
        $paystackFee = $total - $target;

        // Calculate the transaction charge passed to Paystack as an integer in kobo
        $transactionChargeNaira = round($kontrolFee + $paystackFee, 2);

        return [
            'kontrol_fee' => $kontrolFee,
            'paystack_fee' => round($paystackFee, 2),
            'total_amount' => round($total, 2),
            // IMPORTANT: transaction_charge sent via Paystack API must be an INTEGER IN KOBO
            'transaction_charge' => (int) round($transactionChargeNaira * 100),
        ];
    }
}
