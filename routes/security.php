<?php

use App\Http\Controllers\Security\EstateBoardCommentController;
use App\Http\Controllers\Security\EstateBoardController;
use App\Http\Controllers\Security\HomeController;
use App\Http\Controllers\Security\NotificationController;
use App\Http\Controllers\Security\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Security Routes
|--------------------------------------------------------------------------
|
| Routes for security personnel. All routes require authentication
| and the 'security' role (global).
|
*/

Route::middleware('role:security')->group(function (): void {
    // Home - Access Code Validation (Primary Screen)
    Route::get('/', HomeController::class)->name('security.home');
    Route::post('/validate', [HomeController::class, 'validate'])->name('security.validate');

    // Estate Board (Feed)
    Route::prefix('feed')->name('security.feed.')->group(function (): void {
        Route::get('/', [EstateBoardController::class, 'index'])->name('index');
        Route::get('/{post}', [EstateBoardController::class, 'show'])->name('show');

        // Rate-limited comment routes
        Route::middleware('throttle:estate-board-comments')->group(function (): void {
            Route::post('/{post}/comments', [EstateBoardCommentController::class, 'store'])->name('comments.store');
            Route::delete('/comments/{comment}', [EstateBoardCommentController::class, 'destroy'])->name('comments.destroy');
        });
    });

    // Notifications
    Route::prefix('notifications')->name('security.notifications.')->group(function (): void {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('read');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
    });

    // Profile
    Route::prefix('profile')->name('security.profile.')->group(function (): void {
        Route::get('/', [ProfileController::class, 'edit'])->name('edit');
        Route::put('/', [ProfileController::class, 'update'])->name('update');
    });

    // Legacy dashboard redirect
    Route::get('/dashboard', fn () => redirect()->route('security.home'))->name('security.dashboard');
});
