<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EstateBoardController;
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
        Route::patch('residents/{resident}/suspend', [ResidentController::class, 'suspend'])->name('residents.suspend');
        Route::post('residents/{resident}/reset-password', [ResidentController::class, 'resetPassword'])->name('residents.reset-password');
    });

    // Security Personnel management
    Route::middleware('permission:security.view')->group(function (): void {
        Route::resource('security', SecurityPersonnelController::class)->except(['show']);
        Route::patch('security/{security}/suspend', [SecurityPersonnelController::class, 'suspend'])->name('security.suspend');
        Route::post('security/{security}/reset-password', [SecurityPersonnelController::class, 'resetPassword'])->name('security.reset-password');
    });

    // Settings (admin-only, no additional permission needed)
    Route::get('/settings', [SettingsController::class, 'index'])->name('admin.settings');
    Route::put('/settings', [SettingsController::class, 'update'])->name('admin.settings.update');

    // Profile (own profile, no additional permission needed)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('admin.profile');
    Route::put('/profile', [ProfileController::class, 'update'])->name('admin.profile.update');

    // Role management
    Route::middleware('permission:roles.view')->group(function (): void {
        Route::resource('roles', RoleController::class)->except(['show']);
    });

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'index'])->name('admin.notifications.index');
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsRead'])->name('admin.notifications.read');
    Route::post('/notifications/read-all', [\App\Http\Controllers\Admin\NotificationController::class, 'markAllAsRead'])->name('admin.notifications.read-all');
});
