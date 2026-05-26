<?php

/**
 * Public Marketing Routes
 *
 * These routes handle the public marketing pages for the application.
 */

use App\Http\Controllers\Public\ApplicationController;
use App\Http\Controllers\Web\LandingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('landing.home');
Route::get('/product/residents', [LandingController::class, 'residents'])->name('landing.residents');
Route::get('/product/estates', [LandingController::class, 'estates'])->name('landing.estates');
Route::get('/apply', [LandingController::class, 'apply'])->name('landing.apply');
Route::post('/apply', [ApplicationController::class, 'store'])->name('landing.apply.store');
Route::get('/download-app', [LandingController::class, 'downloadApp'])->name('landing.download');

Route::redirect('/features', '/');
Route::redirect('/billing', '/');
Route::redirect('/safety', '/');
Route::redirect('/for-estates', '/');
Route::redirect('/mobile', '/');
Route::redirect('/pricing', '/');
Route::redirect('/contact', '/');
Route::redirect('/privacy', '/');
Route::redirect('/terms', '/');
