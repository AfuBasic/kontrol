<?php

use App\Http\Controllers\Zeus\ApplicationController;
use App\Http\Controllers\Zeus\AuthController;
use App\Http\Controllers\Zeus\DashboardController;
use App\Http\Controllers\Zeus\EstateController;
use App\Http\Middleware\Zeus\EnsureZeusAuthenticated;
use App\Http\Middleware\Zeus\RedirectIfZeusAuthenticated;
use Illuminate\Support\Facades\Route;

Route::prefix('zeus')->name('zeus.')->group(function (): void {
    // Guest routes (redirect to dashboard if already authenticated)
    Route::middleware(RedirectIfZeusAuthenticated::class)->group(function (): void {
        Route::get('/', [AuthController::class, 'showLogin'])->name('login');
        Route::post('/', [AuthController::class, 'login'])->name('login.submit');
    });

    // Authenticated routes
    Route::middleware(EnsureZeusAuthenticated::class)->group(function (): void {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        // Estate management
        Route::get('/estates/create', [EstateController::class, 'create'])->name('estates.create');
        Route::post('/estates', [EstateController::class, 'store'])->name('estates.store');
        Route::get('/estates/{estate}/edit', [EstateController::class, 'edit'])->name('estates.edit');
        Route::put('/estates/{estate}', [EstateController::class, 'update'])->name('estates.update');
        Route::post('/estates/{estate}/toggle-status', [EstateController::class, 'toggleStatus'])->name('estates.toggle-status');
        Route::post('/estates/{estate}/reset-password', [EstateController::class, 'resetPassword'])->name('estates.reset-password');
        Route::delete('/estates/{estate}', [EstateController::class, 'destroy'])->name('estates.destroy');

        // Application management
        Route::post('/applications/{application}/approve', [ApplicationController::class, 'approve'])->name('applications.approve');
        Route::post('/applications/{application}/reject', [ApplicationController::class, 'reject'])->name('applications.reject');
        Route::post('/applications/{application}/contacted', [ApplicationController::class, 'markContacted'])->name('applications.contacted');
    });
});
