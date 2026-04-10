<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeatureController extends Controller
{
    public function index(): Response
    {
        $features = Feature::active()
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get();

        $plans = Plan::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        // Build matrix of features x plans
        $matrix = $features->map(fn (Feature $feature) => [
            'id' => $feature->id,
            'name' => $feature->name,
            'slug' => $feature->slug,
            'description' => $feature->description,
            'group' => $feature->group,
            'is_global' => $feature->is_global,
            'plans' => $plans->map(fn (Plan $plan) => [
                'plan_id' => $plan->id,
                'is_enabled' => $plan->features()
                    ->where('feature_id', $feature->id)
                    ->exists(),
            ]),
        ])->groupBy('group');

        return Inertia::render('zeus/features/index', [
            'features' => $matrix,
            'plans' => $plans,
            'groups' => $features->pluck('group')->unique()->values()->toArray(),
        ]);
    }

    public function toggle(Plan $plan, Feature $feature, Request $request): RedirectResponse
    {
        $isEnabled = $request->boolean('enabled');

        if ($isEnabled) {
            $plan->features()->syncWithoutDetaching([$feature->id => ['is_enabled' => true]]);
        } else {
            $plan->features()->detach($feature->id);
        }

        return back()->with('success', 'Feature updated successfully.');
    }
}
