<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function home(): Response
    {
        $plans = Plan::where('is_active', true)
            ->where('visibility', 'public')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($plan) => [
                'id' => (string) $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => $plan->price,
                'billingInterval' => $plan->billing_interval,
                'discountMultiplier' => $plan->billing_interval === 'annually' ? 0.80 : ($plan->billing_interval === 'semi-annually' ? 0.90 : 1.0),
                'monthsPerInterval' => $plan->billing_interval === 'annually' ? 12 : ($plan->billing_interval === 'semi-annually' ? 6 : 3),
                'basePricePerResident' => 5000,
                'max_residents' => $plan->max_residents,
                'max_security' => $plan->max_security,
                'max_admins' => $plan->max_admins,
                'is_featured' => $plan->is_featured,
                'badge' => $plan->badge,
                'color' => $plan->color,
                'features' => $plan->features->map(fn ($f) => [
                    'name' => $f->name,
                    'slug' => $f->slug,
                ]),
            ]);

        return Inertia::render('Landing/Home', [
            'plans' => $plans,
        ]);
    }

    public function features(): Response
    {
        return Inertia::render('Landing/Features');
    }

    public function billing(): Response
    {
        return Inertia::render('Landing/Billing');
    }

    public function security(): Response
    {
        return Inertia::render('Landing/Security');
    }

    public function forEstates(): Response
    {
        return Inertia::render('Landing/ForEstates');
    }

    public function mobile(): Response
    {
        return Inertia::render('Landing/Mobile');
    }

    public function pricing(): Response
    {
        return Inertia::render('Landing/Pricing', [
            'plans' => Plan::where('is_active', true)
                ->where('visibility', 'public')
                ->where('billing_interval', 'annually') // Just show annual by default
                ->get(),
        ]);
    }

    public function privacy(): Response
    {
        return Inertia::render('Landing/Privacy');
    }

    public function terms(): Response
    {
        return Inertia::render('Landing/Terms');
    }
}
