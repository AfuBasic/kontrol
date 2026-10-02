<?php

namespace App\Http\Controllers\Web;

use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Models\ResidentSubscription;
use App\Models\Scopes\PaymentScope;
use App\Models\User;
use App\Services\Billing\CollectionPaymentSettler;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $settings = EstateSettings::forEstate($assignment->estate_id);
        $allowPartialPayments = (bool) ($settings->allow_partial_payments ?? true);
        $minPartialAmount = $settings->minimum_partial_payment_amount ? round($settings->minimum_partial_payment_amount / 100, 2) : 0;
        $minPartialPercentage = (int) ($settings->minimum_partial_payment_percentage ?? 10);

        return Inertia::render('Web/Billing/PayCollection', [
            'assignment' => $assignment,
            'paystackKey' => config('services.paystack.public_key'),
            'feeBreakdown' => $fees,
            'hasSubscription' => $hasActiveSubscription,
            'allowPartialPayments' => $allowPartialPayments,
            'minPartialAmount' => $minPartialAmount,
            'minPartialPercentage' => $minPartialPercentage,
        ]);
    }

    public function initiate(CollectionAssignment $assignment, PaystackService $paystackService, Request $request): JsonResponse
    {
        app(ContextManager::class)->setSystemContext($assignment->estate_id);
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

        // Collection amounts are stored in NGN (same unit as admin/PO create forms).
        // Frontend sends the amount to charge in NGN. Legacy clients may still send kobo.
        $paymentAmountNaira = (int) $remainingBalance;
        $rawAmount = $request->input('amount');

        if ($rawAmount !== null && $rawAmount !== '') {
            $parsedAmount = (float) $rawAmount;
            if ($parsedAmount > 0) {
                $parsedNaira = $this->normalizePaymentAmountToNaira($parsedAmount, (float) $remainingBalance);
                $paymentAmountNaira = (int) min($remainingBalance, max(1, round($parsedNaira)));
            }
        }

        // Enforce Estate Operational Policies for Partial Payments
        if ($paymentAmountNaira < $remainingBalance) {
            $settings = EstateSettings::forEstate($assignment->estate_id);

            if (! $settings->allow_partial_payments) {
                return response()->json([
                    'message' => 'Partial payments are currently disabled by estate policy. Please pay the full outstanding amount.',
                ], 400);
            }

            $minAmountNaira = $settings->minimum_partial_payment_amount ? (int) round($settings->minimum_partial_payment_amount / 100) : 0;
            if ($minAmountNaira > 0 && $paymentAmountNaira < $minAmountNaira) {
                return response()->json([
                    'message' => 'The minimum partial payment amount allowed by estate policy is ₦'.number_format($minAmountNaira, 2).'.',
                ], 400);
            }

            $minPct = $settings->minimum_partial_payment_percentage ?? 10;
            $minPctNaira = (int) ceil(($assignment->amount_due * $minPct) / 100);
            if ($minPctNaira > 0 && $paymentAmountNaira < $minPctNaira) {
                return response()->json([
                    'message' => "Partial payments must be at least {$minPct}% of the total bill (₦".number_format($minPctNaira, 2).').',
                ], 400);
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
                    $channel = $verification['channel'] ?? 'bank_transfer';
                    if ($channel !== 'bank_transfer') {
                        Log::error("Security violation: Collection payment attempted with restricted channel. Ref={$p->reference}, Channel={$channel}");
                        $p->update(['status' => 'failed']);

                        continue;
                    }

                    $settled = app(CollectionPaymentSettler::class)->settle($p->reference, isset($verification['amount']) ? (int) $verification['amount'] : null);

                    if (isset($settled['error'])) {
                        return response()->json([
                            'message' => 'We received a payment for this bill that is less than expected. Please contact support so it can be reviewed.',
                        ], 409);
                    }

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
        // Payment.amount is stored in NGN (same unit as amount_due / amount_paid).
        $totalAttempts = Payment::where('collection_assignment_id', $assignment->id)->count();
        $suffix = '-a'.($totalAttempts + 1).'-'.Str::random(4);
        $reference = 'COLL-'.$assignment->ulid.$suffix;

        $payment = Payment::create([
            'user_id' => $user->id,
            'estate_id' => $assignment->estate_id,
            'collection_assignment_id' => $assignment->id,
            'amount' => $paymentAmountNaira,
            'reference' => $reference,
            'status' => 'initiated',
        ]);

        // 5. Calculate fees in NGN, convert to kobo only for Paystack Inline
        $baseAmountNaira = (float) $payment->amount;
        $hasActiveSubscription = $this->hasActiveSubscription($user->id);
        $fees = $this->calculateFees($baseAmountNaira, $hasActiveSubscription);
        $amountKobo = (int) round($fees['total_amount'] * 100);

        // Remember what we asked Paystack to collect, so settling can refuse a short payment.
        $payment->update(['raw_payload' => array_merge($payment->raw_payload ?? [], ['expected_kobo' => $amountKobo])]);

        if ($amountKobo < 100) {
            return response()->json([
                'message' => 'Payment amount is too small to process. Minimum charge is ₦1.00.',
            ], 400);
        }

        $payerEmail = $this->resolveValidPayerEmail($user?->email, $assignment->user?->email);

        if (empty($payerEmail)) {
            return response()->json([
                'message' => 'Could not start transaction due to email issues: Your account does not have a valid email address. Please update your profile with a valid email address and try again.',
            ], 422);
        }

        try {
            $paystackInit = $paystackService->initializeTransaction(
                $payerEmail,
                $amountKobo,
                route('web.billing.collection.status', ['reference' => $payment->reference]),
                [], // metadata
                $payment->reference,
                ['bank_transfer'], // RESTRICTED CHANNEL
                [
                    'subaccount' => $subaccount,
                    'bearer' => 'account',
                    'transaction_charge' => $fees['transaction_charge'],
                ]
            );

            return response()->json([
                'already_paid' => false,
                'reference' => $payment->reference,
                'access_code' => $paystackInit['access_code'],
                'email' => $payerEmail,
                'amount' => $fees['total_amount'], // Total charged in NGN
                'amount_kobo' => $amountKobo,
                'base_amount' => $baseAmountNaira,
                'kontrol_fee' => $fees['kontrol_fee'],
                'paystack_fee' => $fees['paystack_fee'],
                'subaccount' => $subaccount,
                'bearer' => 'account',
                'transaction_charge' => $fees['transaction_charge'],
            ]);
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            Log::error('Failed to initialize collection payment with Paystack', [
                'error' => $errorMessage,
                'reference' => $payment->reference,
            ]);

            $userMessage = $this->formatPaymentErrorMessage($errorMessage);

            return response()->json([
                'message' => $userMessage,
            ], 500);
        }
    }

    /**
     * Public route, so it must never credit a payment on a bare reference: Paystack has to confirm the
     * money arrived first. The resident's status page does the same check on its own.
     */
    public function verify(string $reference, PaystackService $paystackService, CollectionPaymentSettler $settler): JsonResponse
    {
        Log::info("Paystack Verification Endpoint Hit: Ref={$reference}");

        $payment = Payment::withoutGlobalScope(PaymentScope::class)->where('reference', $reference)->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $verification = [];

        if ($payment->status !== 'success') {
            try {
                $verification = $paystackService->verifyPayment($reference);
            } catch (\Throwable $e) {
                Log::warning("Could not confirm Ref={$reference} with Paystack: ".$e->getMessage());

                return response()->json(['message' => 'We could not confirm this payment with Paystack yet. Please try again shortly.'], 502);
            }

            if (($verification['status'] ?? null) !== 'success') {
                return response()->json(['message' => 'Payment is not confirmed yet.'], 409);
            }

            if (($verification['channel'] ?? 'bank_transfer') !== 'bank_transfer') {
                Log::error("Security violation: Collection payment attempted with restricted channel. Ref={$reference}");
                $payment->update(['status' => 'failed']);

                return response()->json(['message' => 'Collections can only be paid by bank transfer.'], 422);
            }
        }

        $result = $settler->settle($reference, isset($verification['amount']) ? (int) $verification['amount'] : null);

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json(['message' => $result['message']], $result['status']);
    }

    /**
     * Receipt / status page after Paystack Inline callback (or webhook-confirmed payment).
     * Syncs with Paystack when the local payment is not yet marked success.
     */
    public function status(string $reference, PaystackService $paystackService): Response
    {
        $payment = Payment::withoutGlobalScope(PaymentScope::class)
            ->where('reference', $reference)
            ->firstOrFail();
        app(ContextManager::class)->setSystemContext($payment->estate_id);

        if ($payment->status !== 'success') {
            try {
                $verification = $paystackService->verifyPayment($reference);
                $paystackStatus = $verification['status'] ?? null;

                if ($paystackStatus === 'success') {
                    $channel = $verification['channel'] ?? 'bank_transfer';
                    if ($channel !== 'bank_transfer') {
                        Log::error("Security violation: Collection payment attempted with restricted channel. Ref={$reference}, Channel={$channel}");
                        $payment->update(['status' => 'failed']);
                    } else {
                        app(CollectionPaymentSettler::class)->settle($reference, isset($verification['amount']) ? (int) $verification['amount'] : null);
                        $payment->refresh();
                    }
                } elseif (in_array($paystackStatus, ['failed', 'abandoned', 'reversed'], true)) {
                    $payment->update(['status' => 'failed']);
                }
            } catch (\Exception $e) {
                Log::info("Payment status page could not verify Ref={$reference}: ".$e->getMessage());
            }
        }

        $payment->loadMissing([
            'user:id,name,email',
            'estate:id,name',
            'assignment.collection:id,name,description',
            'assignment.user:id,name,email',
            'assignment.estate:id,name',
        ]);

        $assignment = $payment->assignment;
        $isBulk = (bool) data_get($payment->raw_payload, 'is_bulk', false)
            || (is_array(data_get($payment->raw_payload, 'assignment_ids')) && $payment->collection_assignment_id === null);

        $amountPaid = (int) $payment->amount;
        $amountDue = $assignment ? (int) $assignment->amount_due : $amountPaid;
        $amountAlreadyPaid = $assignment ? (int) $assignment->amount_paid : $amountPaid;
        $remainingBalance = $assignment ? max(0, $amountDue - $amountAlreadyPaid) : 0;

        $status = match (true) {
            $payment->status === 'success' && $remainingBalance <= 0 && ! $isBulk => 'paid_in_full',
            $payment->status === 'success' && $isBulk => 'paid_in_full',
            $payment->status === 'success' && $remainingBalance > 0 => 'partial',
            $payment->status === 'failed' => 'failed',
            default => 'pending',
        };

        $bulkAssignments = [];
        if ($isBulk) {
            $assignmentIds = data_get($payment->raw_payload, 'assignment_ids', []);
            $bulkAssignments = CollectionAssignment::whereIn('id', $assignmentIds)
                ->with(['collection:id,name', 'estate:id,name'])
                ->get()
                ->map(fn (CollectionAssignment $a) => [
                    'ulid' => $a->ulid,
                    'name' => $a->collection?->name,
                    'amount_due' => (int) $a->amount_due,
                    'amount_paid' => (int) $a->amount_paid,
                    'remaining' => max(0, (int) $a->amount_due - (int) $a->amount_paid),
                    'status' => $a->status,
                ])
                ->values()
                ->all();
        }

        $payAgainUrl = null;
        if ($status === 'partial' && $assignment) {
            $payAgainUrl = route('web.billing.collection.show', ['assignment' => $assignment->ulid]);
        }

        return Inertia::render('Web/Billing/PaymentStatus', [
            'reference' => $payment->reference,
            'status' => $status,
            'paymentStatus' => $payment->status,
            'amountPaid' => $amountPaid,
            'amountDue' => $amountDue,
            'amountAlreadyPaid' => $amountAlreadyPaid,
            'remainingBalance' => $remainingBalance,
            'paidAt' => $payment->paid_at?->toIso8601String(),
            'isBulk' => $isBulk,
            'collectionName' => $assignment?->collection?->name
                ?? ($isBulk ? 'Multiple bills' : 'Collection payment'),
            'payerName' => $payment->user?->name
                ?? $assignment?->user?->name
                ?? 'Resident',
            'estateName' => $payment->estate?->name
                ?? $assignment?->estate?->name
                ?? 'Estate',
            'payAgainUrl' => $payAgainUrl,
            'bulkAssignments' => $bulkAssignments,
            'checkoutUrl' => $assignment
                ? route('web.billing.collection.show', ['assignment' => $assignment->ulid])
                : null,
        ]);
    }

    public function showBulk(Request $request): Response
    {
        $ulids = explode(',', $request->query('assignments', ''));
        $assignments = CollectionAssignment::whereIn('ulid', $ulids)
            ->with(['collection.creator.profile', 'estate', 'user'])
            ->get();

        abort_if($assignments->isEmpty(), 404, 'No outstanding bills found.');

        $first = $assignments->first();
        app(ContextManager::class)->setSystemContext($first->estate_id);
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
        app(ContextManager::class)->setSystemContext($first->estate_id);
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
                    $channel = $verification['channel'] ?? 'bank_transfer';
                    if ($channel !== 'bank_transfer') {
                        Log::error("Security violation: Bulk collection payment attempted with restricted channel. Ref={$p->reference}, Channel={$channel}");
                        $p->update(['status' => 'failed']);

                        continue;
                    }

                    $settled = app(CollectionPaymentSettler::class)->settle($p->reference, isset($verification['amount']) ? (int) $verification['amount'] : null);

                    if (isset($settled['error'])) {
                        return response()->json([
                            'message' => 'We received a payment for these bills that is less than expected. Please contact support so it can be reviewed.',
                        ], 409);
                    }

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

        // 3. Calculate fees in NGN (payment.amount is NGN), convert to kobo for Paystack
        $baseAmount = (float) $payment->amount;
        $hasActiveSubscription = $this->hasActiveSubscription($user->id);
        $fees = $this->calculateFees($baseAmount, $hasActiveSubscription);
        $amountKobo = (int) round($fees['total_amount'] * 100);

        // Remember what we asked Paystack to collect, so settling can refuse a short payment.
        $payment->update(['raw_payload' => array_merge($payment->raw_payload ?? [], ['expected_kobo' => $amountKobo])]);

        if ($amountKobo < 100) {
            return response()->json([
                'message' => 'Payment amount is too small to process. Minimum charge is ₦1.00.',
            ], 400);
        }

        $payerEmail = $this->resolveValidPayerEmail($user?->email, $assignments->first()?->user?->email);

        if (empty($payerEmail)) {
            return response()->json([
                'message' => 'Could not start transaction due to email issues: Your account does not have a valid email address. Please update your profile with a valid email address and try again.',
            ], 422);
        }

        try {
            $paystackInit = $paystackService->initializeTransaction(
                $payerEmail,
                $amountKobo,
                route('web.billing.collection.status', ['reference' => $payment->reference]),
                [], // metadata
                $payment->reference,
                ['bank_transfer'], // RESTRICTED CHANNEL
                [
                    'subaccount' => $firstSubaccount,
                    'bearer' => 'account',
                    'transaction_charge' => $fees['transaction_charge'],
                ]
            );

            return response()->json([
                'already_paid' => false,
                'reference' => $payment->reference,
                'access_code' => $paystackInit['access_code'],
                'email' => $payerEmail,
                'amount' => $fees['total_amount'],
                'amount_kobo' => $amountKobo,
                'base_amount' => $baseAmount,
                'kontrol_fee' => $fees['kontrol_fee'],
                'paystack_fee' => $fees['paystack_fee'],
                'subaccount' => $firstSubaccount,
                'bearer' => 'account',
                'transaction_charge' => $fees['transaction_charge'],
            ]);
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            Log::error('Failed to initialize bulk collection payment with Paystack', [
                'error' => $errorMessage,
                'reference' => $payment->reference,
            ]);

            $userMessage = $this->formatPaymentErrorMessage($errorMessage);

            return response()->json([
                'message' => $userMessage,
            ], 500);
        }
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
     * Normalize a client-supplied amount to NGN.
     *
     * Preferred: NGN (e.g. 1000). Legacy clients may send kobo (e.g. 100000 for ₦1,000).
     */
    private function normalizePaymentAmountToNaira(float $rawAmount, float $remainingBalanceNaira): float
    {
        if ($rawAmount <= $remainingBalanceNaira) {
            return $rawAmount;
        }

        $asNairaFromKobo = $rawAmount / 100;

        // Treat as kobo when converting yields a plausible NGN amount within the balance.
        if ($asNairaFromKobo > 0 && $asNairaFromKobo <= $remainingBalanceNaira) {
            return $asNairaFromKobo;
        }

        return $remainingBalanceNaira;
    }

    /**
     * Calculate exact Kontrol and Paystack fees.
     *
     * @return array{kontrol_fee: float, paystack_fee: float, total_amount: float, transaction_charge: int}
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

    /**
     * Resolve a valid payer email for payment gateways.
     */
    private function resolveValidPayerEmail(?string $primaryEmail, ?string $fallbackEmail = null): ?string
    {
        $emails = array_filter([$primaryEmail, $fallbackEmail]);

        foreach ($emails as $email) {
            $email = trim((string) $email);
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                // If it's a dummy test email like .test, or invalid domain format, reject or sanitize
                $domain = substr(strrchr($email, '@'), 1);
                if (! empty($domain) && ! str_ends_with($domain, '.test') && ! str_ends_with($domain, '.example')) {
                    return $email;
                }
            }
        }

        // If primary email is technically formatted as an email (even test env), fallback to billing default in local test env
        if (app()->environment('local', 'testing')) {
            $first = reset($emails);
            if ($first && filter_var($first, FILTER_VALIDATE_EMAIL)) {
                return $first;
            }
        }

        return null;
    }

    /**
     * Format a user-friendly error message from payment gateway exception.
     */
    private function formatPaymentErrorMessage(string $errorMessage): string
    {
        $decoded = json_decode($errorMessage, true);
        $message = is_array($decoded) && isset($decoded['message']) ? $decoded['message'] : $errorMessage;

        if (stripos($message, 'email') !== false) {
            return "Could not start transaction due to email issues: {$message}. Please check and update your email address in your profile.";
        }

        if (stripos($message, 'subaccount') !== false) {
            return 'Could not start transaction: The estate or property owner settlement account is inactive or misconfigured. Please contact support.';
        }

        return 'Failed to initialize payment gateway: '.$message;
    }
}
