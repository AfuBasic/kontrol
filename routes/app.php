<?php

/**
 * Application Routes
 *
 * Entry point for the authenticated SaaS application (app.usekontrol.com).
 * This file orchestrates all application route files under the app domain.
 *
 * Each route file is self-contained with its own middleware definitions.
 */

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Core Application Routes (from web.php)
|--------------------------------------------------------------------------
| Authentication, legal pages, push notifications, invitations, webhooks
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
| Zeus Super-Admin Routes
|--------------------------------------------------------------------------
*/

require base_path('routes/zeus.php');
