<?php

/**
 * Public Marketing Routes
 *
 * These routes handle the public marketing pages for the application.
 */

use App\Http\Controllers\Web\LandingController;
use App\Models\Plan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LandingController::class, 'index'])->name('landing.home');
Route::get('/support', fn () => Inertia::render('Public/Support'))->name('public.support');
Route::post('/support', [LandingController::class, 'support'])->name('public.support.post');
Route::get('/apply', fn () => Inertia::render('Public/Apply', [
    'plans' => Plan::where('is_active', true)
        ->orderBy('sort_order')
        ->get()
        ->map(fn ($plan) => [
            'id' => $plan->id,
            'name' => $plan->name,
            'formatted_price' => $plan->formatted_price,
            'billing_interval' => $plan->billing_interval,
            'badge' => $plan->badge,
        ]),
]))->name('public.apply');
Route::post('/apply', [LandingController::class, 'apply'])->name('public.apply.post');

Route::get('/privacy', fn () => Inertia::render('Public/Privacy'))->name('public.privacy');
Route::get('/terms', fn () => Inertia::render('Public/Terms'))->name('public.terms');
