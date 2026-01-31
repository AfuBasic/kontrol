<?php

use App\Http\Controllers\Security\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Security Routes
|--------------------------------------------------------------------------
|
| Routes for security personnel. All routes require authentication
| and the 'security' role (global).
|
*/

Route::middleware('role:security')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('security.dashboard');

    // Add security-specific routes here
    // Route::get('/access-logs', AccessLogController::class)->name('security.access-logs');
    // Route::get('/visitors', VisitorController::class)->name('security.visitors');
});
