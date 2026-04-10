<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function __invoke(): Response
    {
        $plans = Plan::with(['features' => function ($query) {
            $query->where('is_enabled', true);
        }])
            ->where('visibility', 'public')
            ->where('is_active', true)
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
                'max_residents' => $plan->max_residents,
                'max_security' => $plan->max_security,
                'max_admins' => $plan->max_admins,
                'features' => $plan->features->map(fn ($feature) => [
                    'id' => $feature->id,
                    'name' => $feature->name,
                ]),
            ]);

        return Inertia::render('Public/Landing', [
            'plans' => $plans,
        ]);
    }
}
