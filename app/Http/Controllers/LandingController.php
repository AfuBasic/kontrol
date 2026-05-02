<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('Landing/Home');
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
