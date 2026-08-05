<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Compliance\Violation;
use App\Services\Compliance\ComplianceEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceController extends Controller
{
    public function __construct(
        protected ComplianceEngine $engine
    ) {}

    /**
     * Resident Compliance Dashboard view.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $violations = Violation::query()
            ->where('user_id', $user->id)
            ->with([
                'currentStage',
                'activeRestrictions',
                'activePaymentPlan',
                'timeline',
                'violatable.payments' => function ($query) {
                    $query->where('status', 'success')->orderBy('created_at', 'desc');
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $activeRestrictions = $violations->pluck('activeRestrictions')->flatten();
        $totalOutstanding = (float) $violations->whereIn('status', ['open', 'under_restriction', 'escalated', 'on_payment_plan'])->sum('outstanding_amount');

        return Inertia::render('Resident/Compliance/Index', [
            'violations' => $violations,
            'activeRestrictions' => $activeRestrictions,
            'totalOutstanding' => $totalOutstanding,
            'isCompliant' => $violations->whereIn('status', ['under_restriction', 'escalated'])->isEmpty(),
        ]);
    }

    /**
     * Get detailed immutable timeline for a violation.
     */
    public function timeline(Request $request, Violation $violation): JsonResponse
    {
        if ($violation->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access to compliance timeline.');
        }

        return response()->json([
            'violation' => $violation->load(['policy', 'currentStage']),
            'timeline' => $violation->timeline,
        ]);
    }
}
