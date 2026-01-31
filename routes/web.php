<?php

use App\Http\Controllers\Zeus\InvitationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Estate invitation routes (public, signature-validated)
Route::prefix('invitation')->name('invitation.')->group(function (): void {
    Route::get('/{user}', [InvitationController::class, 'show'])->name('accept');
    Route::post('/{user}', [InvitationController::class, 'store'])->name('store');
    Route::get('/error/invalid', [InvitationController::class, 'invalid'])->name('invalid');
});
