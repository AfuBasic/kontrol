<?php

namespace App\Http\Controllers\Web;

use App\Actions\Auth\DetermineUserRedirect;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
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
        $token = null;
        if (auth()->check()) {
            $token = Str::random(40);
            Cache::put('autologin_'.$token, auth()->id(), now()->addMinutes(5));
        }

        return Inertia::render('Public/DownloadApp', [
            'autologinToken' => $token,
        ]);
    }

    /**
     * Autologin from mobile app deep links.
     */
    public function autologin(Request $request, DetermineUserRedirect $determineRedirect): RedirectResponse
    {
        $token = $request->query('token');
        if (! $token) {
            return redirect()->route('login');
        }

        $userId = Cache::pull('autologin_'.$token);
        if (! $userId) {
            return redirect()->route('login')->with('error', 'Authentication link expired.');
        }

        Auth::loginUsingId($userId);
        $request->session()->regenerate();

        $redirectUrl = $determineRedirect->execute(Auth::user());

        return redirect()->intended($redirectUrl);
    }
}
