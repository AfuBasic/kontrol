<?php

namespace App\Services\Billing;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\CollectionAssignment;
use App\Models\Payment;
use App\Models\ResidentSubscription;
use App\Models\Scopes\CollectionAssignmentScope;
use App\Models\Scopes\PaymentScope;
use App\Models\User;
use App\Notifications\PropertyOwner\CollectionPaymentReceivedNotification;
use App\Notifications\Resident\CollectionPaymentSuccessfulNotification;
use App\Services\Compliance\ComplianceEngine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The one place a collection payment becomes "paid".
 *
 * Callers must already have established that Paystack really received the money: the signed webhook,
 * the resident's status page, and the scheduled recheck all do that before calling settle(). This class
 * locks the payment, credits the charge exactly once, and sends the receipts, so calling it twice
 * (webhook and status page racing, say) never counts the money twice.
 */
class CollectionPaymentSettler
{
    /**
     * @return array{message?: string, error?: string, status: int, settled: bool}
     */
    public function settle(string $reference): array
    {
        Log::info("Paystack Verification Endpoint Hit: Ref={$reference}");
        $result = DB::transaction(function () use ($reference) {
            // 1. Find the payment and lock it
            $payment = Payment::withoutGlobalScope(PaymentScope::class)
                ->where('reference', $reference)
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                Log::warning("Paystack Verification failed: Payment not found for Ref={$reference}");

                return ['error' => 'Payment not found', 'status' => 404, 'settled' => false];
            }

            app(ContextManager::class)->setSystemContext($payment->estate_id);

            // 2. If already success, just return success
            if ($payment->status === 'success') {
                Log::info("Paystack Verification: Already success for Ref={$reference}");

                return ['message' => 'Payment already verified', 'status' => 200, 'settled' => false];
            }

            // Update payment to success
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
            ]);

            if ($payment->collection_assignment_id) {
                $assignment = CollectionAssignment::withoutGlobalScope(CollectionAssignmentScope::class)
                    ->where('id', $payment->collection_assignment_id)->lockForUpdate()->first();
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

                    if ($payment->user) {
                        $payment->user->notify(new CollectionPaymentSuccessfulNotification($payment, $assignment));
                    }
                }
            } elseif ($payment->raw_payload && isset($payment->raw_payload['assignment_ids'])) {
                $assignmentIds = $payment->raw_payload['assignment_ids'];
                $assignments = CollectionAssignment::withoutGlobalScope(CollectionAssignmentScope::class)
                    ->whereIn('id', $assignmentIds)->lockForUpdate()->get();
                foreach ($assignments as $assignment) {
                    $due = $assignment->amount_due - $assignment->amount_paid;
                    if ($due > 0) {
                        $childPayment = Payment::create([
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

                        if ($childPayment->user) {
                            $childPayment->user->notify(new CollectionPaymentSuccessfulNotification($childPayment, $assignment));
                        }
                    }
                }
            }

            Log::info("Paystack Verification completed successfully for Ref={$reference}");

            return ['message' => 'Payment verified successfully', 'status' => 200, 'settled' => true];
        });

        return $result;
    }

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
}
