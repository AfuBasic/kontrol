<?php

use App\Http\Controllers\Zeus\AuthController;
use App\Http\Controllers\Zeus\DashboardController;
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
    });
});
