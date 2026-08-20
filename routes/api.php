<?php

use App\Http\Controllers\Api\V1\Auth\MagicUrlController;
use App\Http\Controllers\ClientErrorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are intended for the mobile application and other API clients.
| They use standard API authentication (e.g., Sanctum).
|
*/

Route::prefix('v1')->group(function () {
    // Client error reporting endpoint (rate limited to prevent flooding)
    Route::post('/client-errors', [ClientErrorController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('api.v1.client-errors');

    Route::middleware('auth:sanctum')->group(function () {
        // Magic Login URL generation for mobile app -> web transition
        Route::get('/auth/magic-url', [MagicUrlController::class, 'store'])->name('api.v1.auth.magic-url');
    });
});
