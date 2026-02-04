<?php

use App\Http\Controllers\Resident\AccessCodeController;
use App\Http\Controllers\Resident\ActivityController;
use App\Http\Controllers\Resident\EstateBoardCommentController;
use App\Http\Controllers\Resident\EstateBoardController;
use App\Http\Controllers\Resident\EstateContactController;
use App\Http\Controllers\Resident\HomeController;
use App\Http\Controllers\Resident\PasswordController;
use App\Http\Controllers\Resident\ProfileController;
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
    // Legacy dashboard redirect
    Route::get('/dashboard', fn () => redirect()->route('resident.home'))->name('resident.dashboard');

    // New consumer-style home
    Route::get('/home', HomeController::class)->name('resident.home');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('resident.profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('resident.profile.update');
    Route::put('/password', [PasswordController::class, 'update'])->name('resident.password.update');

    // Activity feed
    Route::get('/activity', ActivityController::class)->name('resident.activity');

    // Estate Contacts
    Route::get('/contacts', [EstateContactController::class, 'index'])->name('resident.contacts.index');
    Route::get('/contacts/json', [EstateContactController::class, 'apiIndex'])->name('resident.contacts.json');

    // Access Codes (Visitors)
    Route::prefix('visitors')->name('resident.visitors.')->group(function (): void {
        Route::get('/', [AccessCodeController::class, 'index'])->name('index');
        Route::get('/create', [AccessCodeController::class, 'create'])->name('create');
        Route::post('/', [AccessCodeController::class, 'store'])->name('store');
        Route::get('/{accessCode}/success', [AccessCodeController::class, 'success'])->name('success');
        Route::get('/{accessCode}', [AccessCodeController::class, 'show'])->name('show');
        Route::delete('/{accessCode}', [AccessCodeController::class, 'destroy'])->name('destroy');
    });

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
