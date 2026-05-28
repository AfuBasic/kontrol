<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * Render the public landing/home page.
     */
    public function index(): Response
    {
        $plans = Plan::with([
            'features' => function ($query) {
                $query->wherePivot('is_enabled', true);
            },
        ])
            ->where('visibility', 'public')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function (Plan $plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price, // In kobo/cents (e.g. 600000)
                    'formatted_price' => $plan->formatted_price,
                    'billing_interval' => $plan->billing_interval,
                    'is_featured' => $plan->is_featured,
                    'badge' => $plan->badge,
                    'color' => $plan->color,
                    'max_residents' => $plan->max_residents,
                    'max_security' => $plan->max_security,
                    'max_admins' => $plan->max_admins,
                    'features' => $plan->features->map(function ($feature) {
                        return [
                            'name' => $feature->name,
                            'slug' => $feature->slug,
                            'group' => $feature->group,
                            'limit' => $feature->pivot->limit,
                        ];
                    })->toArray(),
                ];
            });

        return Inertia::render('Public/Home', [
            'plans' => $plans,
        ]);
    }

    /**
     * Render the public Residents page.
     */
    public function residents(): Response
    {
        return Inertia::render('Public/Residents');
    }

    /**
     * Render the public Estates page.
     */
    public function estates(): Response
    {
        return Inertia::render('Public/Estates');
    }

    /**
     * Render the public application form page.
     */
    public function apply(): Response
    {
        $plans = Plan::where('visibility', 'public')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function (Plan $plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'price' => $plan->price,
                    'billing_interval' => $plan->billing_interval,
                ];
            });

        return Inertia::render('Public/Apply', [
            'plans' => $plans,
        ]);
    }

    /**
     * Render the public app download page.
     */
    public function downloadApp(): Response
    {
        return Inertia::render('Public/DownloadApp');
    }
}
