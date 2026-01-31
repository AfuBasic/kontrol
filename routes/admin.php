<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Routes for estate administrators. All routes require authentication
| and the 'admin' role (scoped to the user's estate).
|
*/

Route::middleware('role:admin')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('admin.dashboard');

    // Role management
    Route::resource('roles', RoleController::class)->except(['show']);

    // Permission management
    Route::resource('permissions', PermissionController::class)->except(['show']);
});
