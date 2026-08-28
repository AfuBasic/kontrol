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
use App\Models\CommissionableRevenue;
use App\Models\Coupon;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\Partner;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\Zeus\EstateHealthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
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

        $residentUsers = $estate->users()
            ->wherePivot('status', 'accepted')
            ->whereExists(function ($sub) use ($estate) {
                $sub->select(DB::raw(1))
                    ->from('model_has_roles')
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->whereColumn('model_has_roles.model_id', 'users.id')
                    ->where('model_has_roles.model_type', User::class)
                    ->where('model_has_roles.estate_id', $estate->id)
                    ->whereIn('roles.name', ['resident', 'property_owner']);
            })
            ->with([
                'residentSubscriptions' => fn ($q) => $q->where('estate_id', $estate->id),
            ])
            ->get();

        $activeCount = 0;
        $trialCount = 0;
        $pastDueCount = 0;
        $expiredCount = 0;

        foreach ($residentUsers as $rUser) {
            $sub = $rUser->residentSubscriptions->first();
            $subStatus = $sub?->status;
            if ($subStatus === 'active') {
                $activeCount++;
            } elseif ($subStatus === 'trial') {
                $trialCount++;
            } elseif ($subStatus === 'past_due') {
                $pastDueCount++;
            } else {
                $expiredCount++;
            }
        }

        $residentStats = [
            'total' => $residentUsers->count(),
            'active' => $activeCount,
            'trial' => $trialCount,
            'past_due' => $pastDueCount,
            'expired' => $expiredCount,
        ];

        // Financial Analytics - consolidated into a single database query
        $financialStats = PaymentTransaction::where('estate_id', $estate->id)
            ->selectRaw('
                COALESCE(SUM(CASE WHEN status = "success" THEN amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN status = "success" AND created_at >= ? THEN amount ELSE 0 END), 0) as monthly_revenue,
                COUNT(*) as total_attempts,
                COALESCE(SUM(CASE WHEN status = "success" THEN 1 ELSE 0 END), 0) as successful_attempts
            ', [now()->startOfMonth()])
            ->first();

        $totalRevenue = (int) ($financialStats->total_revenue ?? 0);
        $monthlyRevenue = (int) ($financialStats->monthly_revenue ?? 0);
        $totalAttempts = (int) ($financialStats->total_attempts ?? 0);
        $successfulAttempts = (int) ($financialStats->successful_attempts ?? 0);
        $successRate = $totalAttempts > 0 ? round(($successfulAttempts / $totalAttempts) * 100, 1) : 100;

        $outstandingAmount = (int) Invoice::where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->sum('amount');

        $recentTransactions = PaymentTransaction::where('estate_id', $estate->id)
            ->with(['invoice.user:id,name,email'])
            ->latest()
            ->limit(10)
            ->get();

        $userIds = $residentUsers->pluck('id')->unique()->toArray();
        $lastInvoices = Invoice::whereIn('user_id', $userIds)
            ->where('estate_id', $estate->id)
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($invoices) => $invoices->first());

        $residents = $residentUsers->map(function ($user) use ($lastInvoices) {
            $sub = $user->residentSubscriptions->first();
            $lastInvoice = $lastInvoices->get($user->id);

            return [
                'id' => $sub?->id ?? $user->id,
                'ulid' => $sub?->ulid ?? $user->ulid,
                'user' => [
                    'id' => $user->id,
                    'ulid' => $user->ulid,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'status' => $sub?->status ?? 'past_due',
                'last_payment_at' => $sub?->last_paid_at?->toDateString(),
                'last_amount' => $lastInvoice?->amount ?? 0,
                'next_due' => $sub?->current_period_end?->toDateString(),
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

        $partnerEarnings = null;
        if ($estate->partner_id) {
            $partnerCommissionStats = CommissionableRevenue::where('estate_id', $estate->id)
                ->where('partner_id', $estate->partner_id)
                ->selectRaw('
                    COALESCE(SUM(commission_amount), 0) as total_commission,
                    COALESCE(SUM(CASE WHEN created_at >= ? THEN commission_amount ELSE 0 END), 0) as current_month_commission
                ', [now()->startOfMonth()])
                ->first();

            $partnerEarnings = [
                'current_month_commission' => (int) ($partnerCommissionStats?->current_month_commission ?? 0),
                'total_commission' => (int) ($partnerCommissionStats?->total_commission ?? 0),
            ];
        }

        return Inertia::render('Zeus/Estates/Show', [
            'estate' => array_merge($estate->toArray(), [
                'commission_days_remaining' => $estate->commissionDaysRemaining(),
            ]),
            'partners' => Partner::active()->orderBy('name')->get(['id', 'name', 'email', 'commission_rate']),
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
            'partnerEarnings' => $partnerEarnings,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Zeus/Estates/Create', [
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
