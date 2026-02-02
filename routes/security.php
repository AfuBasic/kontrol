<?php

use App\Http\Controllers\Security\DashboardController;
use App\Http\Controllers\Security\EstateBoardCommentController;
use App\Http\Controllers\Security\EstateBoardController;
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
    Route::get('/dashboard', DashboardController::class)->name('security.dashboard');

    // Estate Board (read-only + comments)
    Route::prefix('estate-board')->name('security.estate-board.')->group(function (): void {
        Route::get('/', [EstateBoardController::class, 'index'])->name('index');
        Route::get('/{post}', [EstateBoardController::class, 'show'])->name('show');

        // Rate-limited comment routes
        Route::middleware('throttle:estate-board-comments')->group(function (): void {
            Route::post('/{post}/comments', [EstateBoardCommentController::class, 'store'])->name('comments.store');
            Route::delete('/comments/{comment}', [EstateBoardCommentController::class, 'destroy'])->name('comments.destroy');
        });
    });
});
