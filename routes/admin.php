<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EstateBoardCommentController;
use App\Http\Controllers\Admin\EstateBoardController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\ResidentController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SecurityPersonnelController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\ContentEnhanceController;
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

Route::middleware('auth')->group(function (): void {
    // Legacy dashboard redirect
    Route::get('/dashboard', DashboardController::class)->name('admin.dashboard');

    // Estate Board
    Route::prefix('estate-board')->name('admin.estate-board.')->group(function (): void {
        Route::get('/', [EstateBoardController::class, 'index'])->name('index');
        Route::get('/manage', [EstateBoardController::class, 'manage'])->name('manage');
        Route::get('/create', [EstateBoardController::class, 'create'])->name('create');
        Route::post('/enhance-content', ContentEnhanceController::class)->name('enhance-content');
        Route::get('/{post}', [EstateBoardController::class, 'show'])->name('show');
        Route::get('/{post}/edit', [EstateBoardController::class, 'edit'])->name('edit');

        // Rate-limited mutation routes for posts
        Route::middleware('throttle:estate-board-posts')->group(function (): void {
            Route::post('/', [EstateBoardController::class, 'store'])->name('store');
            Route::put('/{post}', [EstateBoardController::class, 'update'])->name('update');
            Route::delete('/{post}', [EstateBoardController::class, 'destroy'])->name('destroy');
        });

        // Rate-limited comment routes
        Route::middleware('throttle:estate-board-comments')->group(function (): void {
            Route::post('/{post}/comments', [EstateBoardCommentController::class, 'store'])->name('comments.store');
            Route::delete('/comments/{comment}', [EstateBoardCommentController::class, 'destroy'])->name('comments.destroy');
        });
    });

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

    // Settings (admin-only)
    Route::middleware('role:admin')->group(function (): void {
        Route::get('/settings', [SettingsController::class, 'index'])->name('admin.settings');
        Route::put('/settings', [SettingsController::class, 'update'])->name('admin.settings.update');

        // Activity Log
        Route::get('/activity-log', [ActivityLogController::class, 'index'])->name('admin.activity-log.index');
    });

    // Profile (own profile)
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

    // Admin User management (manage other admins)
    Route::middleware('role:admin')->group(function (): void {
        Route::resource('users', UserController::class)->except(['show']);
    });
});
