<?php

use App\Http\Controllers\Organization\AccessMemberController;
use App\Http\Controllers\Organization\ArrivalController;
use App\Http\Controllers\Organization\ContextController;
use App\Http\Controllers\Organization\CredentialController;
use App\Http\Controllers\Organization\DashboardController;
use App\Http\Controllers\Organization\PublicWindowController;
use App\Http\Controllers\Organization\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'org.membership'])->prefix('org')->name('org.')->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Context switching
    Route::post('/switch/{organization}', [ContextController::class, 'switchOrganization'])->name('context.switch');

    // Access List (Members)
    Route::prefix('access-list')->name('access-list.')->group(function () {
        Route::get('/', [AccessMemberController::class, 'index'])->name('index');
        Route::post('/', [AccessMemberController::class, 'store'])->name('store');
        Route::patch('/{member}', [AccessMemberController::class, 'update'])->name('update');
        Route::post('/{member}/suspend', [AccessMemberController::class, 'suspend'])->name('suspend');
        Route::post('/{member}/activate', [AccessMemberController::class, 'activate'])->name('activate');
    });

    // Credentials
    Route::prefix('credentials')->name('credentials.')->group(function () {
        Route::get('/', [CredentialController::class, 'index'])->name('index');
        Route::post('/issue/{member}', [CredentialController::class, 'issue'])->name('issue');
        Route::post('/{credential}/renew', [CredentialController::class, 'renew'])->name('renew');
        Route::post('/{credential}/revoke', [CredentialController::class, 'revoke'])->name('revoke');
    });

    // Arrivals & History
    Route::prefix('arrivals')->name('arrivals.')->group(function () {
        Route::get('/', [ArrivalController::class, 'index'])->name('index');
        Route::get('/history', [ArrivalController::class, 'history'])->name('history');
        Route::post('/{log}/confirm', [ArrivalController::class, 'confirm'])->name('confirm');
    });

    // Public Access Windows
    Route::prefix('public-windows')->name('public-windows.')->group(function () {
        Route::get('/', [PublicWindowController::class, 'index'])->name('index');
        Route::post('/', [PublicWindowController::class, 'store'])->name('store');
        Route::patch('/{window}', [PublicWindowController::class, 'update'])->name('update');
        Route::delete('/{window}', [PublicWindowController::class, 'destroy'])->name('destroy');
    });

    // Settings & Staff
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::patch('/confirmation-policy', [SettingsController::class, 'updateConfirmationPolicy'])->name('confirmation-policy.update');
        Route::post('/staff', [SettingsController::class, 'inviteStaff'])->name('staff.invite');
        Route::delete('/staff/{targetMembership}', [SettingsController::class, 'removeStaff'])->name('staff.remove');
    });
});
