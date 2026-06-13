<?php

/**
 * Public Marketing Routes
 *
 * These routes handle the public marketing pages for the application.
 */

use App\Http\Controllers\Web\LandingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('landing.home');
Route::get('/autologin', [LandingController::class, 'autologin'])->name('autologin');
