<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\OverrideEstateSubscriptionAction;
use App\Http\Controllers\Controller;
use App\Models\Estate;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Estate::with('subscriptionRecord', 'subscriptionRecord.plan')
            ->orderBy('name');

        // Filter by status
        if ($request->filled('status')) {
            $query->whereHas('subscriptionRecord', fn ($q) => $q->where('status', $request->status));
        }

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        $estates = $query->paginate(15);
        $plans = Plan::where('is_active', true)->orderBy('sort_order')->get();

        return Inertia::render('Zeus/Subscriptions/Index', [
            'estates' => $estates->through(function (Estate $estate) {
                $sub = $estate->subscriptionRecord;

                return [
                    'id' => $estate->id,
                    'name' => $estate->name,
                    'email' => $estate->email,
                    'plan_id' => $sub?->plan_id,
                    'plan_name' => $sub?->plan?->name ?? 'No Plan',
                    'status' => $sub?->status ?? 'no_plan',
                    'billing_interval' => $sub?->billing_interval ?? 'monthly',
                    'trial_ends_at' => $sub?->trial_ends_at?->format('Y-m-d'),
                    'current_period_end' => $sub?->current_period_end?->format('Y-m-d'),
                    'is_overridden' => ! is_null($sub?->overridden_by),
                    'override_notes' => $sub?->override_notes,
                ];
            }),
            'plans' => $plans,
            'statuses' => ['trial', 'active', 'past_due', 'cancelled'],
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function override(Estate $estate, Request $request, OverrideEstateSubscriptionAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $action->execute($estate, $validated);

        return back()->with('success', 'Subscription overridden successfully.');
    }
}
