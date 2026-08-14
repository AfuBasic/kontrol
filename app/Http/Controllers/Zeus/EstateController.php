<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\CreateEstateAction;
use App\Actions\Zeus\DeleteEstateAction;
use App\Actions\Zeus\ResendEstateAdminInvitationAction;
use App\Actions\Zeus\ToggleEstateStatusAction;
use App\Actions\Zeus\UpdateEstateAction;
use App\Actions\Zeus\UpdatePartnerAssignmentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\StoreEstateRequest;
use App\Http\Requests\Zeus\UpdateEstateRequest;
use App\Http\Requests\Zeus\UpdatePartnerAssignmentRequest;
use App\Models\Coupon;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\Partner;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Services\Zeus\EstateHealthService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EstateController extends Controller
{
    public function index(EstateHealthService $healthService): Response
    {
        $search = request('search');
        $status = request('status');

        $estates = $healthService->getEstateExplorerData([
            'search' => $search,
            'status' => $status,
        ]);

        return Inertia::render('Zeus/Estates/Index', [
            'estates' => $estates,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    public function show(Estate $estate): Response
    {
        $estate->load([
            'subscriptionRecord.plan',
            'settings',
            'partner',
            'commissionPlan',
        ]);

        $stats = $estate->residentSubscriptions()
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial,
                SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) as past_due,
                SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
            ")->first();

        $residentStats = [
            'total' => (int) ($stats->total ?? 0),
            'active' => (int) ($stats->active ?? 0),
            'trial' => (int) ($stats->trial ?? 0),
            'past_due' => (int) ($stats->past_due ?? 0),
            'expired' => (int) ($stats->expired ?? 0),
        ];

        // Financial Analytics
        $totalRevenue = PaymentTransaction::where('estate_id', $estate->id)
            ->where('status', 'success')
            ->sum('amount');

        $monthlyRevenue = PaymentTransaction::where('estate_id', $estate->id)
            ->where('status', 'success')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('amount');

        $outstandingAmount = Invoice::where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->sum('amount');

        $totalAttempts = PaymentTransaction::where('estate_id', $estate->id)->count();
        $successfulAttempts = PaymentTransaction::where('estate_id', $estate->id)->where('status', 'success')->count();
        $successRate = $totalAttempts > 0 ? round(($successfulAttempts / $totalAttempts) * 100, 1) : 100;

        $recentTransactions = PaymentTransaction::where('estate_id', $estate->id)
            ->with(['invoice.user:id,name,email'])
            ->latest()
            ->limit(10)
            ->get();

        $rawResidents = ResidentSubscription::where('estate_id', $estate->id)
            ->with('user:id,ulid,name,email')
            ->get();

        $userIds = $rawResidents->pluck('user_id')->unique()->toArray();
        $lastInvoices = Invoice::whereIn('user_id', $userIds)
            ->where('estate_id', $estate->id)
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($invoices) => $invoices->first());

        $residents = $rawResidents->map(function ($sub) use ($lastInvoices) {
            $lastInvoice = $lastInvoices->get($sub->user_id);

            return [
                'id' => $sub->id,
                'ulid' => $sub->ulid,
                'user' => $sub->user,
                'status' => $sub->status,
                'last_payment_at' => $sub->last_paid_at?->toDateString(),
                'last_amount' => $lastInvoice?->amount ?? 0,
                'next_due' => $sub->current_period_end?->toDateString(),
            ];
        });

        $admin = $estate->users()
            ->wherePivot('status', 'accepted')
            ->whereHas('roles', function ($q) use ($estate) {
                $q->where('roles.name', 'admin')->where('model_has_roles.estate_id', $estate->id);
            })
            ->first();

        $activeCoupons = Coupon::where('estate_id', $estate->id)
            ->where('status', 'active')
            ->withinValidityPeriod()
            ->latest()
            ->get();

        return Inertia::render('Zeus/Estates/Show', [
            'estate' => array_merge($estate->toArray(), [
                'commission_days_remaining' => $estate->commissionDaysRemaining(),
            ]),
            'residentStats' => $residentStats,
            'analytics' => [
                'total_revenue' => $totalRevenue,
                'monthly_revenue' => $monthlyRevenue,
                'outstanding_amount' => $outstandingAmount,
                'success_rate' => $successRate,
            ],
            'recentTransactions' => $recentTransactions,
            'residents' => $residents,
            'admin' => $admin,
            'activeCoupons' => $activeCoupons,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Zeus/Estates/Create', [
            'plans' => Plan::with('features')->get(),
            'partners' => Partner::active()->orderBy('name')->get(['id', 'name', 'commission_rate']),
        ]);
    }

    public function updatePartnerAssignment(
        UpdatePartnerAssignmentRequest $request,
        Estate $estate,
        UpdatePartnerAssignmentAction $action,
    ): RedirectResponse {
        $action->execute($estate, $request->validated());

        return redirect()
            ->route('zeus.estates.show', $estate)
            ->with('success', 'Partner assignment updated successfully.');
    }

    public function store(StoreEstateRequest $request, CreateEstateAction $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Estate created successfully. An invitation has been sent.');
    }

    public function edit(Estate $estate): Response
    {
        return Inertia::render('Zeus/Estates/Edit', [
            'estate' => array_merge(
                $estate->only(['id', 'ulid', 'name', 'email', 'address', 'status']),
                ['admin_accepted' => $estate->hasAcceptedAdmin()],
                ['charge_type' => $estate->settings?->charge_type ?? 'residents'],
                ['free_trial_enabled' => $estate->settings?->free_trial_enabled ?? true],
                ['free_trial_days' => $estate->settings?->free_trial_days ?? 30],
                ['grace_period_days' => $estate->settings?->grace_period_days ?? 2]
            ),
        ]);
    }

    public function update(UpdateEstateRequest $request, Estate $estate, UpdateEstateAction $action): RedirectResponse
    {
        $action->execute($estate, $request->validated());

        return redirect()
            ->route('zeus.estates.edit', $estate->id)
            ->with('success', 'Estate updated successfully.');
    }

    public function toggleStatus(Estate $estate, ToggleEstateStatusAction $action): RedirectResponse
    {
        $action->execute($estate);

        $status = $estate->fresh()->status;

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', "Estate {$status} successfully.");
    }

    public function resendInvitation(Estate $estate, ResendEstateAdminInvitationAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Invitation link has been sent to the estate admin.');
    }

    public function destroy(Estate $estate, DeleteEstateAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Estate deleted successfully.');
    }
}
