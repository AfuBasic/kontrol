<?php

use App\Http\Controllers\Security\EstateBoardCommentController;
use App\Http\Controllers\Security\EstateBoardController;
use App\Http\Controllers\Security\HomeController;
use App\Http\Controllers\Security\NotificationController;
use App\Http\Controllers\Security\ProfileController;
use App\Http\Controllers\Security\VerifyController;
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
    // Home - Command Center
    Route::get('/', HomeController::class)->name('security.home');

    // Verify - Access Code Validation Terminal
    Route::get('/verify', VerifyController::class)->name('security.verify');
    Route::post('/verify/validate', [VerifyController::class, 'validate'])->name('security.verify.validate');
    Route::post('/verify/decision', [VerifyController::class, 'decision'])->name('security.verify.decision');

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
