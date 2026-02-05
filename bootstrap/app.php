<?php

use App\Http\Middleware\EnsureIsAdmin;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectIfAuthenticated;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function (): void {
            Route::middleware('web')
                ->group(base_path('routes/zeus.php'));

            Route::middleware(['web', 'auth', EnsureIsAdmin::class])
                ->prefix('admin')
                ->group(base_path('routes/admin.php'));

            Route::middleware(['web', 'auth'])
                ->prefix('security')
                ->group(base_path('routes/security.php'));

            Route::middleware(['web', 'auth'])
                ->prefix('resident')
                ->group(base_path('routes/resident.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->trustProxies('*');
        $middleware->validateCsrfTokens(except: [
            'telegram/webhook',
        ]);
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'guest' => RedirectIfAuthenticated::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })->create();
