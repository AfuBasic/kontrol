<?php

use App\Http\Controllers\Api\V1\Auth\MagicUrlController;
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
    Route::middleware('auth:sanctum')->group(function () {
        // Magic Login URL generation for mobile app -> web transition
        Route::get('/auth/magic-url', [MagicUrlController::class, 'store'])->name('api.v1.auth.magic-url');
    });
});
