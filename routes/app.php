<?php

/**
 * Application Routes
 *
 * Entry point for the authenticated SaaS application (app.kontrol.test).
 */

use App\Http\Controllers\Web\LandingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Application Root Redirect
|--------------------------------------------------------------------------
| Any visit to the app domain root should always go to login.
*/
if (config('domains.routing_enabled', true)) {
    Route::get('/', function () {
        return redirect()->route('login');
    });
}

if (! Route::getRoutes()->hasNamedRoute('autologin')) {
    Route::get('/autologin', [LandingController::class, 'autologin'])->name('autologin');
}

/*
|--------------------------------------------------------------------------
| Core Application Routes (from web.php)
|--------------------------------------------------------------------------
*/
require base_path('routes/web.php');

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(base_path('routes/admin.php'));

/*
|--------------------------------------------------------------------------
| Security Personnel Routes
|--------------------------------------------------------------------------
*/
Route::prefix('security')->group(base_path('routes/security.php'));

/*
|--------------------------------------------------------------------------
| Resident Routes
|--------------------------------------------------------------------------
*/
Route::prefix('resident')->group(base_path('routes/resident.php'));

/*
|--------------------------------------------------------------------------
| Affiliate Routes
|--------------------------------------------------------------------------
*/
Route::prefix('affiliate')->group(base_path('routes/affiliate.php'));

/*
|--------------------------------------------------------------------------
| Zeus Super-Admin Routes
|--------------------------------------------------------------------------
*/
require base_path('routes/zeus.php');
