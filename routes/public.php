<?php

/**
 * Public Marketing Routes
 *
 * These routes redirect all public marketing traffic to the login area.
 */

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return "Coming soon";
})->name('landing.home');

Route::redirect('/features', '/');
Route::redirect('/billing', '/');
Route::redirect('/safety', '/');
Route::redirect('/for-estates', '/');
Route::redirect('/mobile', '/');
Route::redirect('/pricing', '/');
Route::redirect('/contact', '/');
Route::redirect('/apply', '/');
Route::redirect('/privacy', '/');
Route::redirect('/terms', '/');
