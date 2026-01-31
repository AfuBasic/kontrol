<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EstateBoardController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\ResidentController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SecurityPersonnelController;
use App\Http\Controllers\Admin\SettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Routes for estate administrators. All routes require authentication
| and the 'admin' role (scoped to the user's estate).
|
*/

Route::middleware('role:admin')->group(function (): void {
    // Legacy dashboard redirect
    Route::get('/dashboard', DashboardController::class)->name('admin.dashboard');

    // Estate Board (default landing page)
    Route::get('/estate', EstateBoardController::class)->name('admin.estate');

    // Residents management
    Route::middleware('permission:residents.view')->group(function (): void {
        Route::resource('residents', ResidentController::class)->except(['show']);
    });

    // Security Personnel management
    Route::middleware('permission:security.view')->group(function (): void {
        Route::resource('security', SecurityPersonnelController::class)->except(['show']);
    });

    // Settings
    Route::get('/settings', SettingsController::class)
        ->name('admin.settings')
        ->middleware('permission:settings.view');

    // Profile (own profile, no additional permission needed)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('admin.profile');
    Route::put('/profile', [ProfileController::class, 'update'])->name('admin.profile.update');

    // Role management
    Route::resource('roles', RoleController::class)->except(['show']);

    // Permission management
    Route::resource('permissions', PermissionController::class)->except(['show']);
});
