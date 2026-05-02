<?php

/**
 * Public Marketing Routes
 *
 * These routes serve the public marketing site (kontrol.test).
 */

use App\Http\Controllers\LandingController;
use App\Http\Controllers\Public\ApplicationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Marketing Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [LandingController::class, 'home'])->name('landing.home');
Route::get('/features', [LandingController::class, 'features'])->name('landing.features');
Route::get('/billing', [LandingController::class, 'billing'])->name('landing.billing');
Route::get('/safety', [LandingController::class, 'security'])->name('landing.safety');
Route::get('/for-estates', [LandingController::class, 'forEstates'])->name('landing.for-estates');
Route::get('/mobile', [LandingController::class, 'mobile'])->name('landing.mobile');
Route::get('/pricing', [LandingController::class, 'pricing'])->name('landing.pricing');

/*
|--------------------------------------------------------------------------
| Estate Application
|--------------------------------------------------------------------------
*/

Route::post('/apply', [ApplicationController::class, 'store'])->name('public.apply');

/*
|--------------------------------------------------------------------------
| Legal Pages
|--------------------------------------------------------------------------
*/

Route::get('/privacy', [LandingController::class, 'privacy'])->name('landing.privacy');
Route::get('/terms', [LandingController::class, 'terms'])->name('landing.terms');
