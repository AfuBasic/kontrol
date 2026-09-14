<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\EstateOrganization;
use App\Services\OrganizationContextService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        // Check if any collection assignments are linked to the current organization's admin/members or organization context
        $userId = $request->user()->id;

        $assignments = CollectionAssignment::query()
            ->where('user_id', $userId)
            ->with(['collection'])
            ->latest('due_date')
            ->get();

        $outstanding = $assignments->filter(fn (CollectionAssignment $a) => in_array($a->status, ['pending', 'overdue', 'grace', 'partial'], true))
            ->values()
            ->map(fn (CollectionAssignment $a) => [
                'id' => $a->id,
                'name' => $a->collection?->name ?? 'Estate Charge',
                'description' => $a->collection?->description,
                'amount_due' => (float) $a->amount_due,
                'amount_paid' => (float) $a->amount_paid,
                'status' => $a->status,
                'due_date' => $a->due_date?->toDateString(),
                'due_date_human' => $a->due_date?->format('d M Y'),
                'is_overdue' => $a->status === 'overdue' || ($a->due_date && $a->due_date->isPast()),
            ]);

        $paidHistory = $assignments->filter(fn (CollectionAssignment $a) => $a->status === 'paid')
            ->values()
            ->map(fn (CollectionAssignment $a) => [
                'id' => $a->id,
                'name' => $a->collection?->name ?? 'Estate Charge',
                'amount_paid' => (float) $a->amount_paid,
                'paid_at' => $a->updated_at?->format('d M Y'),
                'status' => 'paid',
            ]);

        $totalOutstanding = $outstanding->sum('amount_due') - $outstanding->sum('amount_paid');

        return Inertia::render('Organization/Payments', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'type' => $organization->type,
                'estate_name' => $organization->estate?->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'total_outstanding' => max(0, $totalOutstanding),
            'outstanding' => $outstanding,
            'paid_history' => $paidHistory,
        ]);
    }
}
