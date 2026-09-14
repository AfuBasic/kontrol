<?php

use App\Http\Controllers\Organization\AccessMemberController;
use App\Http\Controllers\Organization\AnnouncementController;
use App\Http\Controllers\Organization\ArrivalController;
use App\Http\Controllers\Organization\ContextController;
use App\Http\Controllers\Organization\CredentialController;
use App\Http\Controllers\Organization\DashboardController;
use App\Http\Controllers\Organization\PaymentController;
use App\Http\Controllers\Organization\PublicWindowController;
use App\Http\Controllers\Organization\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'org.membership'])->prefix('org')->name('org.')->group(function () {
    // 1. Home
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Context switching
    Route::post('/switch/{organization}', [ContextController::class, 'switchOrganization'])->name('context.switch');

    // 2. Access Hub: People (Access List)
    Route::prefix('access-list')->name('access-list.')->group(function () {
        Route::get('/', [AccessMemberController::class, 'index'])->name('index');
        Route::post('/', [AccessMemberController::class, 'store'])->name('store');
        Route::patch('/{member}', [AccessMemberController::class, 'update'])->name('update');
        Route::post('/{member}/suspend', [AccessMemberController::class, 'suspend'])->name('suspend');
        Route::post('/{member}/activate', [AccessMemberController::class, 'activate'])->name('activate');
    });

    // Access: Credentials (issue/renew/revoke actions)
    Route::prefix('credentials')->name('credentials.')->group(function () {
        Route::get('/', [CredentialController::class, 'index'])->name('index');
        Route::post('/issue/{member}', [CredentialController::class, 'issue'])->name('issue');
        Route::post('/{credential}/renew', [CredentialController::class, 'renew'])->name('renew');
        Route::post('/{credential}/revoke', [CredentialController::class, 'revoke'])->name('revoke');
    });

    // Access: Arrivals & History
    Route::prefix('arrivals')->name('arrivals.')->group(function () {
        Route::get('/', fn () => redirect()->route('org.access-list.index', ['tab' => 'arrivals']))->name('index');
        Route::get('/history', fn () => redirect()->route('org.access-list.index', ['tab' => 'history']))->name('history');
        Route::post('/{log}/confirm', [ArrivalController::class, 'confirm'])->name('confirm');
    });

    // Access: Public Access Windows (for Public Window policies e.g. Churches)
    Route::prefix('public-windows')->name('public-windows.')->group(function () {
        Route::get('/', fn () => redirect()->route('org.access-list.index', ['tab' => 'public_windows']))->name('index');
        Route::post('/', [PublicWindowController::class, 'store'])->name('store');
        Route::patch('/{window}', [PublicWindowController::class, 'update'])->name('update');
        Route::delete('/{window}', [PublicWindowController::class, 'destroy'])->name('destroy');
    });

    // 3. Payments
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');

    // 4. Announcements
    Route::prefix('announcements')->name('announcements.')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index'])->name('index');
        Route::get('/{post}', [AnnouncementController::class, 'show'])->name('show');
    });

    // 5. Profile & Settings (Team & Preferences)
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::patch('/confirmation-policy', [SettingsController::class, 'updateConfirmationPolicy'])->name('confirmation-policy.update');
        Route::post('/staff', [SettingsController::class, 'inviteStaff'])->name('staff.invite');
        Route::delete('/staff/{targetMembership}', [SettingsController::class, 'removeStaff'])->name('staff.remove');
    });
});
