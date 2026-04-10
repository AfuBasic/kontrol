<?php

use App\Http\Controllers\Affiliate\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Affiliate Routes
|--------------------------------------------------------------------------
|
| Routes for affiliate members.
|
*/

Route::middleware('role:affiliate')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('affiliate.dashboard');
});
