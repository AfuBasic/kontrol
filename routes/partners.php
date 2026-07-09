<?php

use App\Http\Controllers\Partner\BankingController;
use App\Http\Controllers\Partner\DashboardController;
use App\Http\Controllers\Partner\EarningsController;
use App\Http\Controllers\Partner\NotificationController;
use App\Http\Controllers\Partner\PartnerRequestController;
use App\Http\Controllers\Partner\ProfileController;
use App\Http\Controllers\Partner\SupportController;
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
    Route::get('/profile', ProfileController::class)->name('partner.profile');
    Route::get('/support', SupportController::class)->name('partner.support');

    Route::post('/banking/resolve', [BankingController::class, 'resolve'])
        ->middleware('throttle:20,1')
        ->name('partner.banking.resolve');
    Route::put('/banking', [BankingController::class, 'update'])
        ->middleware('throttle:10,1')
        ->name('partner.banking.update');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('partner.notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('partner.notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('partner.notifications.read-all');
    Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll'])->name('partner.notifications.clear-all');

    Route::get('/partner-requests', [PartnerRequestController::class, 'index'])->name('partner.partner-requests.index');
    Route::get('/partner-requests/create', [PartnerRequestController::class, 'create'])->name('partner.partner-requests.create');
    Route::post('/partner-requests', [PartnerRequestController::class, 'store'])->name('partner.partner-requests.store');
    Route::delete('/partner-requests/{partnerRequest}', [PartnerRequestController::class, 'destroy'])
        ->name('partner.partner-requests.destroy');

    Route::get('/estates/{estate:ulid}', [PartnerRequestController::class, 'showEstate'])
        ->name('partner.estates.show');
});
