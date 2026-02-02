<?php

use App\Http\Controllers\Resident\DashboardController;
use App\Http\Controllers\Resident\EstateBoardCommentController;
use App\Http\Controllers\Resident\EstateBoardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Resident Routes
|--------------------------------------------------------------------------
|
| Routes for estate residents. All routes require authentication
| and the 'resident' role (global).
|
*/

Route::middleware('role:resident')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('resident.dashboard');

    // Estate Board (read-only + comments)
    Route::prefix('estate-board')->name('resident.estate-board.')->group(function (): void {
        Route::get('/', [EstateBoardController::class, 'index'])->name('index');
        Route::get('/{post}', [EstateBoardController::class, 'show'])->name('show');

        // Rate-limited comment routes
        Route::middleware('throttle:estate-board-comments')->group(function (): void {
            Route::post('/{post}/comments', [EstateBoardCommentController::class, 'store'])->name('comments.store');
            Route::delete('/comments/{comment}', [EstateBoardCommentController::class, 'destroy'])->name('comments.destroy');
        });
    });
});
