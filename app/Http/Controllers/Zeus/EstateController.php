<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\CreateEstateAction;
use App\Actions\Zeus\DeleteEstateAction;
use App\Actions\Zeus\ResetEstateAdminPasswordAction;
use App\Actions\Zeus\ToggleEstateStatusAction;
use App\Actions\Zeus\UpdateEstateAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\StoreEstateRequest;
use App\Http\Requests\Zeus\UpdateEstateRequest;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EstateController extends Controller
{
    public function index(): Response
    {
        $search = request('search');
        $status = request('status');

        $query = Estate::query()
            ->with('subscriptionRecord.plan:id,name,billing_interval');

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('status', $status);
        }

        $estates = $query->paginate(15);

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
            'referrer.affiliate',
        ]);

        $residentStats = [
            'total' => $estate->residentSubscriptions()->count(),
            'active' => $estate->residentSubscriptions()->where('status', 'active')->count(),
            'trial' => $estate->residentSubscriptions()->where('status', 'trial')->count(),
            'past_due' => $estate->residentSubscriptions()->where('status', 'past_due')->count(),
            'expired' => $estate->residentSubscriptions()->where('status', 'expired')->count(),
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

        $residents = ResidentSubscription::where('estate_id', $estate->id)
            ->with('user:id,name,email')
            ->get()
            ->map(function ($sub) use ($estate) {
                $lastInvoice = Invoice::where('user_id', $sub->user_id)
                    ->where('estate_id', $estate->id)
                    ->latest()
                    ->first();

                return [
                    'id' => $sub->id,
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

        return Inertia::render('Zeus/Estates/Show', [
            'estate' => $estate,
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
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Zeus/Estates/Create', [
            'plans' => Plan::with('features')->get(),
        ]);
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
                $estate->only(['id', 'name', 'email', 'address', 'status']),
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

    public function resetPassword(Estate $estate, ResetEstateAdminPasswordAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Password reset link has been sent to the estate admin.');
    }

    public function destroy(Estate $estate, DeleteEstateAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Estate deleted successfully.');
    }
}
