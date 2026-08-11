<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\Payment;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        abort_if($user->isHouseholdMember(), 403, 'Household members do not have access to dues or collections.');

        $estate = $this->estateContext->getEstate();
        $propertyOwnerId = $user->getPropertyOwnerForEstate($estate)?->id;
        $searchPaid = request()->query('search_paid');
        $sourcePaid = request()->query('source_paid');

        $outstandingAssignments = CollectionAssignment::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->with(['collection.creator'])
            ->latest()
            ->get()
            ->map(function ($assignment) use ($propertyOwnerId) {
                $isPoBill = $propertyOwnerId && $assignment->collection->created_by == $propertyOwnerId;
                $assignment->is_property_owner_bill = $isPoBill;
                $assignment->billing_source = $isPoBill ? 'property_owner' : 'estate';

                return $assignment;
            });

        $paidQuery = CollectionAssignment::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->where('status', 'paid')
            ->with(['collection.creator']);

        if ($sourcePaid === 'estate') {
            $paidQuery->whereHas('collection', function ($q) use ($propertyOwnerId) {
                if ($propertyOwnerId) {
                    $q->where('created_by', '!=', $propertyOwnerId);
                }
            });
        } elseif ($sourcePaid === 'property_owner') {
            $paidQuery->whereHas('collection', function ($q) use ($propertyOwnerId) {
                if ($propertyOwnerId) {
                    $q->where('created_by', $propertyOwnerId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            });
        }

        if (! empty($searchPaid)) {
            $paidQuery->whereHas('collection', function ($q) use ($searchPaid) {
                $q->where('name', 'like', "%{$searchPaid}%");
            });
        }

        $paidPaginated = $paidQuery->latest()->paginate(5, ['*'], 'page_paid')->withQueryString();

        $paidPaginated->getCollection()->transform(function ($assignment) use ($propertyOwnerId) {
            $isPoBill = $propertyOwnerId && $assignment->collection->created_by == $propertyOwnerId;
            $assignment->is_property_owner_bill = $isPoBill;
            $assignment->billing_source = $isPoBill ? 'property_owner' : 'estate';

            return $assignment;
        });

        return Inertia::render('Resident/Collections/Index', [
            'summary' => [
                'outstanding' => $outstandingAssignments,
            ],
            'paid' => Inertia::scroll(fn () => $paidPaginated),
            'filters' => [
                'search_paid' => $searchPaid,
                'source_paid' => $sourcePaid,
            ],
        ]);
    }

    public function show(CollectionAssignment $assignment): Response
    {
        $user = auth()->user();
        abort_if($user->isHouseholdMember(), 403, 'Household members do not have access to dues or collections.');
        abort_if($assignment->user_id !== $user->id, 403);

        $assignment->load([
            'collection.creator',
            'payments' => function ($query) {
                $query->where('status', 'success')->orderBy('paid_at')->orderBy('id');
            },
        ]);

        $propertyOwnerId = $user->getPropertyOwnerForEstate($this->estateContext->getEstate())?->id;
        $isPoBill = (bool) ($propertyOwnerId && $assignment->collection->created_by == $propertyOwnerId);
        $assignment->is_property_owner_bill = $isPoBill;
        $assignment->billing_source = $isPoBill ? 'property_owner' : 'estate';

        $journey = $this->buildPaymentJourney($assignment);

        return Inertia::render('Resident/Collections/Show', [
            'assignment' => $assignment,
            'journey' => $journey,
        ]);
    }

    /**
     * Build the payment-journey payload for the bill details experience.
     *
     * @return array{
     *     status_label: string,
     *     payment_count: int,
     *     total_paid: int,
     *     remaining_balance: int,
     *     percentage_paid: float,
     *     completion_date: string|null,
     *     total_transactions: int,
     *     original_amount: int,
     *     late_fees: int,
     *     discounts: int,
     *     total_outstanding: int,
     *     contextual_insight: string,
     *     cta_label: string|null,
     *     billing_cycle_label: string,
     *     payment_activity: list<array<string, mixed>>,
     *     timeline: list<array<string, mixed>>
     * }
     */
    private function buildPaymentJourney(CollectionAssignment $assignment): array
    {
        $originalAmount = (int) $assignment->amount_due;
        $totalPaid = (int) $assignment->amount_paid;
        $remainingBalance = max(0, $originalAmount - $totalPaid);
        $percentagePaid = $originalAmount > 0
            ? round(min(100, ($totalPaid / $originalAmount) * 100), 1)
            : ($totalPaid > 0 ? 100.0 : 0.0);

        $successfulPayments = $assignment->payments
            ->where('status', 'success')
            ->values();

        $paymentCount = $successfulPayments->count();
        $lateFees = (int) ($assignment->collection?->late_fee ?? 0);
        $discounts = 0;

        $runningPaid = 0;
        $paymentActivity = $successfulPayments->values()->map(function (Payment $payment, int $index) use ($originalAmount, &$runningPaid) {
            $runningPaid += (int) $payment->amount;
            $remainingAfter = max(0, $originalAmount - $runningPaid);

            return [
                'id' => $payment->id,
                'sequence' => $index + 1,
                'type' => $remainingAfter <= 0 ? 'full_payment' : 'partial_payment',
                'label' => 'Payment #'.($index + 1),
                'status' => 'completed',
                'amount' => (int) $payment->amount,
                'remaining_balance_after' => $remainingAfter,
                'provider' => $payment->provider ?: 'paystack',
                'reference' => $payment->reference,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'paid_at_label' => $this->humanPaymentDate($payment->paid_at),
            ];
        })->values()->all();

        $timeline = [
            [
                'id' => 'invoice-created',
                'type' => 'invoice_created',
                'label' => 'Invoice Created',
                'description' => $assignment->collection?->name,
                'amount' => $originalAmount,
                'remaining_balance_after' => $originalAmount,
                'occurred_at' => $assignment->created_at?->toIso8601String(),
                'occurred_at_label' => $assignment->created_at?->format('M j, Y'),
                'state' => 'complete',
            ],
        ];

        foreach ($paymentActivity as $activity) {
            $timeline[] = [
                'id' => 'payment-'.$activity['id'],
                'type' => $activity['type'],
                'label' => 'Payment Received',
                'description' => $activity['label'],
                'amount' => $activity['amount'],
                'remaining_balance_after' => $activity['remaining_balance_after'],
                'occurred_at' => $activity['paid_at'],
                'occurred_at_label' => $activity['paid_at_label'],
                'state' => 'complete',
                'meta' => [
                    'provider' => $activity['provider'],
                    'reference' => $activity['reference'],
                ],
            ];
        }

        if ($remainingBalance > 0) {
            $timeline[] = [
                'id' => 'balance-outstanding',
                'type' => 'balance_outstanding',
                'label' => 'Balance Outstanding',
                'description' => null,
                'amount' => $remainingBalance,
                'remaining_balance_after' => $remainingBalance,
                'occurred_at' => null,
                'occurred_at_label' => null,
                'state' => 'current',
            ];
        } else {
            $timeline[] = [
                'id' => 'fully-settled',
                'type' => 'fully_settled',
                'label' => 'Fully Settled',
                'description' => 'This bill has been completely paid.',
                'amount' => $originalAmount,
                'remaining_balance_after' => 0,
                'occurred_at' => $assignment->paid_at?->toIso8601String(),
                'occurred_at_label' => $assignment->paid_at?->format('M j, Y'),
                'state' => 'complete',
            ];
        }

        $billingCycleLabel = $this->resolveBillingCycleLabel($assignment);
        $statusLabel = $this->resolveStatusLabel($assignment, $remainingBalance);
        $ctaLabel = $this->resolveCtaLabel($assignment, $remainingBalance, $paymentCount);
        $contextualInsight = $this->resolveContextualInsight(
            $assignment,
            $paymentCount,
            $percentagePaid,
            $remainingBalance,
            $successfulPayments->last(),
        );

        return [
            'status_label' => $statusLabel,
            'payment_count' => $paymentCount,
            'total_paid' => $totalPaid,
            'remaining_balance' => $remainingBalance,
            'percentage_paid' => $percentagePaid,
            'completion_date' => $assignment->paid_at?->toIso8601String(),
            'total_transactions' => $paymentCount,
            'original_amount' => $originalAmount,
            'late_fees' => $lateFees,
            'discounts' => $discounts,
            'total_outstanding' => $remainingBalance,
            'contextual_insight' => $contextualInsight,
            'cta_label' => $ctaLabel,
            'billing_cycle_label' => $billingCycleLabel,
            'payment_activity' => $paymentActivity,
            'timeline' => $timeline,
        ];
    }

    private function resolveStatusLabel(CollectionAssignment $assignment, int $remainingBalance): string
    {
        return match ($assignment->status) {
            'paid' => 'Paid',
            'partial' => 'Partially Paid',
            'overdue' => 'Overdue',
            'grace' => 'Outstanding',
            'cancelled' => 'Cancelled',
            default => $remainingBalance <= 0 ? 'Paid' : ($assignment->amount_paid > 0 ? 'Partially Paid' : 'Outstanding'),
        };
    }

    private function resolveCtaLabel(CollectionAssignment $assignment, int $remainingBalance, int $paymentCount): ?string
    {
        if ($remainingBalance <= 0 || $assignment->status === 'paid') {
            return null;
        }

        $formatted = '₦'.number_format($remainingBalance);

        if ($paymentCount === 0) {
            return "Pay {$formatted}";
        }

        if ($assignment->status === 'partial' || $assignment->amount_paid > 0) {
            return "Pay Remaining {$formatted}";
        }

        return "Complete Payment · {$formatted}";
    }

    private function resolveBillingCycleLabel(CollectionAssignment $assignment): string
    {
        if (! empty($assignment->period)) {
            return (string) $assignment->period;
        }

        $collection = $assignment->collection;
        if ($collection?->billing_type === 'recurring') {
            return ucfirst((string) ($collection->recurring_interval ?? 'Recurring'));
        }

        return 'One-Time';
    }

    private function resolveContextualInsight(
        CollectionAssignment $assignment,
        int $paymentCount,
        float $percentagePaid,
        int $remainingBalance,
        ?Payment $lastPayment,
    ): string {
        if ($remainingBalance <= 0 || $assignment->status === 'paid') {
            $date = $assignment->paid_at?->format('M j, Y');

            return $date
                ? "This bill was fully settled on {$date}."
                : 'This bill has been completely paid.';
        }

        if ($paymentCount === 0) {
            return 'No payments have been made yet.';
        }

        if ($lastPayment?->paid_at?->isToday()) {
            return 'Your last payment was received today.';
        }

        if ($percentagePaid >= 50) {
            $rounded = (int) round($percentagePaid);

            return "You've settled {$rounded}% of this bill.";
        }

        if ($paymentCount > 0) {
            $label = $paymentCount === 1 ? '1 payment' : "{$paymentCount} payments";

            return "You've completed {$label}.";
        }

        if ($assignment->due_date && $assignment->due_date->isFuture()) {
            return 'You are on track to complete payment before the due date.';
        }

        return 'Only ₦'.number_format($remainingBalance).' remains.';
    }

    private function humanPaymentDate(?CarbonInterface $date): ?string
    {
        if (! $date) {
            return null;
        }

        if ($date->isToday()) {
            return 'Today';
        }

        if ($date->isYesterday()) {
            return 'Yesterday';
        }

        return $date->format('M j, Y');
    }

    public function verify(CollectionAssignment $assignment, PaystackService $paystackService): JsonResponse
    {
        $user = auth()->user();
        abort_if($assignment->user_id !== $user->id, 403);

        // Find all pending/initiated payment transactions for this assignment
        $initiatedPayments = Payment::where('collection_assignment_id', $assignment->id)
            ->where('status', '!=', 'success')
            ->get();

        foreach ($initiatedPayments as $payment) {
            try {
                $verification = $paystackService->verifyPayment($payment->reference);

                if ($verification['status'] === 'success') {
                    DB::transaction(function () use ($payment, $assignment) {
                        // Lock the rows for update to ensure atomicity and prevent race conditions
                        $lockedPayment = Payment::where('id', $payment->id)->lockForUpdate()->first();
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
                        'status' => 'success',
                        'is_paid' => true,
                        'message' => 'Payment verified and recorded successfully!',
                    ]);
                }
            } catch (\Exception $e) {
                Log::warning('Failed to verify collection payment status: '.$e->getMessage(), [
                    'assignment_id' => $assignment->id,
                    'reference' => $payment->reference,
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'is_paid' => $assignment->isPaid(),
            'message' => 'Payment not verified or not found.',
        ]);
    }
}
