<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\CreatePlanAction;
use App\Actions\Zeus\DeletePlanAction;
use App\Actions\Zeus\UpdatePlanAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\StorePlanRequest;
use App\Http\Requests\Zeus\UpdatePlanRequest;
use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(): Response
    {
        $plans = Plan::with('features')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => $plan->price,
                'formatted_price' => $plan->formatted_price,
                'billing_interval' => $plan->billing_interval,
                'is_featured' => $plan->is_featured,
                'badge' => $plan->badge,
                'color' => $plan->color,
                'visibility' => $plan->visibility,
                'max_residents' => $plan->max_residents,
                'max_security' => $plan->max_security,
                'max_admins' => $plan->max_admins,
                'is_active' => $plan->is_active,
                'features_count' => $plan->features->count(),
                'subscriptions_count' => $plan->subscriptions()->count(),
            ]);

        return Inertia::render('zeus/plans/index', [
            'plans' => $plans,
        ]);
    }

    public function create(): Response
    {
        $features = Feature::active()
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Feature $feature) => [
                'id' => $feature->id,
                'name' => $feature->name,
                'slug' => $feature->slug,
                'description' => $feature->description,
                'group' => $feature->group,
                'suggested_plan' => $feature->suggested_plan,
            ])
            ->groupBy('group')
            ->map(fn ($group) => $group->values());

        $copyPlan = null;
        if (request()->has('copy')) {
            $planId = request()->input('copy');
            $plan = Plan::with('features')->find($planId);

            if ($plan) {
                $copyPlan = [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'billing_interval' => $plan->billing_interval,
                    'is_featured' => $plan->is_featured,
                    'badge' => $plan->badge,
                    'color' => $plan->color,
                    'visibility' => $plan->visibility,
                    'max_residents' => $plan->max_residents,
                    'max_security' => $plan->max_security,
                    'max_admins' => $plan->max_admins,
                    'features' => $plan->features->pluck('id')->toArray(),
                ];
            }
        }

        return Inertia::render('zeus/plans/create', [
            'features' => $features,
            'copyPlan' => $copyPlan,
        ]);
    }

    public function store(StorePlanRequest $request, CreatePlanAction $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()
            ->route('zeus.plans.index')
            ->with('success', 'Plan created successfully.');
    }

    public function edit(Plan $plan): Response
    {
        $features = Feature::active()
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Feature $feature) => [
                'id' => $feature->id,
                'name' => $feature->name,
                'slug' => $feature->slug,
                'description' => $feature->description,
                'group' => $feature->group,
                'suggested_plan' => $feature->suggested_plan,
            ])
            ->groupBy('group')
            ->map(fn ($group) => $group->values());

        return Inertia::render('zeus/plans/edit', [
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => $plan->price,
                'billing_interval' => $plan->billing_interval,
                'is_featured' => $plan->is_featured,
                'badge' => $plan->badge,
                'color' => $plan->color,
                'visibility' => $plan->visibility,
                'max_residents' => $plan->max_residents,
                'max_security' => $plan->max_security,
                'max_admins' => $plan->max_admins,
                'is_active' => $plan->is_active,
                'features' => $plan->features->pluck('id')->toArray(),
            ],
            'features' => $features,
        ]);
    }

    public function update(UpdatePlanRequest $request, Plan $plan, UpdatePlanAction $action): RedirectResponse
    {
        $action->execute($plan, $request->validated());

        return redirect()
            ->route('zeus.plans.index')
            ->with('success', 'Plan updated successfully.');
    }

    public function destroy(Plan $plan, DeletePlanAction $action): RedirectResponse
    {
        // Check if plan has active subscriptions
        if ($plan->subscriptions()->where('status', '!=', 'cancelled')->exists()) {
            return redirect()
                ->route('zeus.plans.index')
                ->with('error', 'Cannot delete a plan with active subscriptions.');
        }

        $action->execute($plan);

        return redirect()
            ->route('zeus.plans.index')
            ->with('success', 'Plan deleted successfully.');
    }
}
