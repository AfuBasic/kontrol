<?php

use App\Http\Controllers\Resident\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Resident Routes
|--------------------------------------------------------------------------
|
| Routes for estate residents. All routes require authentication
| and the 'resident' role (global).
|
*/

Route::middleware('role:resident')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('resident.dashboard');

    // Add resident-specific routes here
    // Route::get('/visitors', VisitorController::class)->name('resident.visitors');
    // Route::get('/requests', RequestController::class)->name('resident.requests');
});
