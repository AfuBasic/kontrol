<?php

use App\Http\Controllers\Partner\DashboardController;
use App\Http\Controllers\Partner\EarningsController;
use App\Http\Controllers\Partner\PartnerRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Partner Routes
|--------------------------------------------------------------------------
|
| Routes for partner (affiliate) members.
|
*/

Route::middleware('role:affiliate')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('partner.dashboard');
    Route::get('/earnings', EarningsController::class)->name('partner.earnings');
    Route::get('/partner-requests', [PartnerRequestController::class, 'index'])->name('partner.partner-requests.index');
    Route::get('/partner-requests/create', [PartnerRequestController::class, 'create'])->name('partner.partner-requests.create');
    Route::post('/partner-requests', [PartnerRequestController::class, 'store'])->name('partner.partner-requests.store');
});
