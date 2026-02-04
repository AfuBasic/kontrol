<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\Zeus\InvitationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return to_route('login');
})->name('home');

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| Push Notification Subscription Routes
|--------------------------------------------------------------------------
*/
Route::prefix('push')->name('push.')->group(function (): void {
    Route::get('/vapid-public-key', [PushSubscriptionController::class, 'vapidPublicKey'])->name('vapid');
    Route::middleware('auth')->group(function (): void {
        Route::post('/subscribe', [PushSubscriptionController::class, 'store'])->name('subscribe');
        Route::post('/unsubscribe', [PushSubscriptionController::class, 'destroy'])->name('unsubscribe');
    });
});

/*
|--------------------------------------------------------------------------
| Estate Invitation Routes (public, signature-validated)
|--------------------------------------------------------------------------
*/
Route::prefix('invitation')->name('invitation.')->group(function (): void {
    Route::get('/{user}', [InvitationController::class, 'show'])->name('accept');
    Route::post('/{user}', [InvitationController::class, 'store'])->name('store');
    Route::get('/error/invalid', [InvitationController::class, 'invalid'])->name('invalid');
});
