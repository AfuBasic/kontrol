<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\Payment;
use App\Services\EstateContextService;
use App\Services\PaystackService;
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
        $propertyOwnerId = $user->profile?->property_owner_id;

        $assignments = CollectionAssignment::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->with(['collection.creator'])
            ->latest()
            ->get()
            ->map(function ($assignment) use ($propertyOwnerId) {
                $isPoBill = $propertyOwnerId && $assignment->collection->created_by == $propertyOwnerId;
                $assignment->is_property_owner_bill = $isPoBill;
                $assignment->billing_source = $isPoBill ? 'property_owner' : 'estate';

                return $assignment;
            });

        $summary = [
            'outstanding' => $assignments->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])->values(),
            'paid' => $assignments->where('status', 'paid')->values(),
        ];

        return Inertia::render('Resident/Collections/Index', [
            'summary' => $summary,
            'allAssignments' => $assignments,
        ]);
    }

    public function show(CollectionAssignment $assignment): Response
    {
        $user = auth()->user();
        abort_if($user->isHouseholdMember(), 403, 'Household members do not have access to dues or collections.');
        abort_if($assignment->user_id !== $user->id, 403);

        $assignment->load(['collection.creator', 'payments' => function ($query) {
            $query->where('status', 'success')->latest();
        }]);

        $propertyOwnerId = $user->profile?->property_owner_id;
        $isPoBill = $propertyOwnerId && $assignment->collection->created_by == $propertyOwnerId;
        $assignment->is_property_owner_bill = $isPoBill;
        $assignment->billing_source = $isPoBill ? 'property_owner' : 'estate';

        return Inertia::render('Resident/Collections/Show', [
            'assignment' => $assignment,
        ]);
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
