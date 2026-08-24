<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compliance\CompliancePolicy;
use App\Models\Compliance\Violation;
use App\Services\Compliance\ComplianceEngine;
use App\Services\EstateContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceController extends Controller
{
    public function __construct(
        protected ComplianceEngine $engine,
        protected EstateContextService $estateContext,
    ) {}

    /**
     * Display the Admin Compliance Command Center dashboard.
     */
    public function index(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();
        $estateId = $estate->id;

        $violationsQuery = Violation::query()
            ->with([
                'user',
                'property',
                'policy',
                'currentStage',
                'activeRestrictions',
                'activePaymentPlan',
                'violatable.payments' => function ($query) {
                    $query->where('status', 'success')->orderBy('created_at', 'desc');
                },
            ])
            ->when($estateId, fn ($q) => $q->where('estate_id', $estateId));

        // Filters
        if ($request->filled('status')) {
            $violationsQuery->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $violationsQuery->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        $violations = $violationsQuery->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Operational metrics
        $metrics = [
            'good_standing_count' => $estate ? $estate->users()->count() - Violation::where('estate_id', $estateId)->whereIn('status', ['open', 'under_restriction', 'escalated'])->distinct('user_id')->count() : 0,
            'under_restriction_count' => Violation::where('estate_id', $estateId)->where('status', 'under_restriction')->count(),
            'total_penalties_amount' => (float) Violation::where('estate_id', $estateId)->sum('total_penalties_applied'),
            'on_payment_plan_count' => Violation::where('estate_id', $estateId)->where('status', 'on_payment_plan')->count(),
            'escalated_count' => Violation::where('estate_id', $estateId)->where('status', 'escalated')->count(),
        ];

        return Inertia::render('Admin/Compliance/Index', [
            'violations' => $violations,
            'metrics' => $metrics,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Display policy configuration page.
     */
    public function policies(Request $request): Response
    {
        $estateId = $this->estateContext->getEstateId();

        $policies = CompliancePolicy::query()
            ->where('estate_id', $estateId)
            ->with(['stages.actions'])
            ->get();

        return Inertia::render('Admin/Compliance/PolicyConfig', [
            'policies' => $policies,
        ]);
    }

    /**
     * Create or update policy stages.
     */
    public function updatePolicy(Request $request, CompliancePolicy $policy): JsonResponse
    {
        $this->authorizePolicyEstate($policy);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'payment_plan_policy' => 'nullable|array',
            'stages' => 'required|array',
            'stages.*.stage_name' => 'required|string',
            'stages.*.trigger_days' => 'required|integer|min:0',
            'stages.*.order' => 'required|integer',
            'stages.*.actions' => 'nullable|array',
            'stages.*.actions.*.action_type' => 'required|string|max:100',
            'stages.*.actions.*.configuration' => 'nullable|array',
            'stages.*.actions.*.is_enabled' => 'boolean',
        ]);

        $policy->update([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
            'payment_plan_policy' => $validated['payment_plan_policy'] ?? [],
        ]);

        // Sync stages
        foreach ($validated['stages'] as $stageData) {
            $stage = $policy->stages()->updateOrCreate(
                ['order' => $stageData['order']],
                [
                    'stage_name' => $stageData['stage_name'],
                    'trigger_days' => $stageData['trigger_days'],
                ]
            );

            if (! empty($stageData['actions'])) {
                $stage->actions()->delete();
                foreach ($stageData['actions'] as $act) {
                    $stage->actions()->create([
                        'action_type' => $act['action_type'],
                        'configuration' => $act['configuration'] ?? [],
                        'is_enabled' => $act['is_enabled'] ?? true,
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Policy updated successfully', 'policy' => $policy->fresh(['stages.actions'])]);
    }

    /**
     * Approve payment plan for a resident violation.
     */
    public function approvePaymentPlan(Request $request, Violation $violation): JsonResponse
    {
        $this->authorizeViolationEstate($violation);

        $validated = $request->validate([
            'installment_amount' => 'required|numeric|min:1',
            'frequency' => 'required|string|in:weekly,biweekly,monthly',
            'start_date' => 'required|date',
            'terms' => 'nullable|array',
        ]);

        $plan = $this->engine->violations->approvePaymentPlan(
            $violation,
            (float) $validated['installment_amount'],
            $validated['frequency'],
            $validated['start_date'],
            $request->user(),
            $validated['terms'] ?? null
        );

        return response()->json(['message' => 'Payment plan approved', 'payment_plan' => $plan]);
    }

    /**
     * Manually resolve or waive a violation.
     */
    public function resolveViolation(Request $request, Violation $violation): JsonResponse
    {
        $this->authorizeViolationEstate($violation);

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $this->engine->resolution->resolve($violation, $validated['reason']);

        return response()->json(['message' => 'Violation resolved successfully']);
    }

    private function authorizePolicyEstate(CompliancePolicy $policy): void
    {
        $estate = $this->estateContext->getEstate();

        abort_if($policy->estate_id !== $estate->id, 404);
    }

    private function authorizeViolationEstate(Violation $violation): void
    {
        $estate = $this->estateContext->getEstate();

        abort_if($violation->estate_id !== $estate->id, 404);
    }
}
