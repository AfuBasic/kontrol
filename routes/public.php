<?php

/**
 * Public Marketing Routes
 *
 * These routes serve the public marketing site (usekontrol.com).
 *
 * Responsibilities:
 * - Landing page
 * - Legal pages (privacy, terms)
 *
 * NO authenticated features belong here.
 * NO dashboards or app functionality.
 */

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Marketing Routes
|--------------------------------------------------------------------------
*/

Route::get('/', fn () => Inertia::render('Public/Landing'))->name('public.home');

/*
|--------------------------------------------------------------------------
| Legal Pages
|--------------------------------------------------------------------------
*/

Route::get('/privacy', fn () => Inertia::render('Public/Privacy'))->name('public.privacy');
Route::get('/terms', fn () => Inertia::render('Public/Terms'))->name('public.terms');
