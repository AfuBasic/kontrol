<?php

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
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        using: function (): void {
            $domainRoutingEnabled = config('domains.routing_enabled', true);
            $isLocal = app()->environment('local');

            /*
            |------------------------------------------------------------------
            | Domain-Based Routing
            |------------------------------------------------------------------
            |
            | When domain routing is enabled and we're not in local environment
            | (or local with subdomain simulation), use domain constraints.
            |
            | PUBLIC domain (usekontrol.com): Marketing routes
            | APP domain (app.usekontrol.com): Application routes
            |
            */

            if ($domainRoutingEnabled && ! $isLocal) {
                // Production / Staging: Full domain-based routing
                Route::domain(config('domains.root'))
                    ->middleware('web')
                    ->group(base_path('routes/public.php'));

                Route::domain(config('domains.app'))
                    ->middleware('web')
                    ->group(base_path('routes/app.php'));
            } elseif ($domainRoutingEnabled && $isLocal && config('domains.app_subdomain')) {
                // Local with subdomain simulation (e.g., app.usekontrol.test)
                Route::domain(config('domains.root'))
                    ->middleware('web')
                    ->group(base_path('routes/public.php'));

                Route::domain(config('domains.app'))
                    ->middleware('web')
                    ->group(base_path('routes/app.php'));
            } else {
                // Local fallback: Load all routes without domain restrictions
                // Both public and app routes accessible on localhost
                Route::middleware('web')
                    ->group(base_path('routes/public.php'));

                Route::middleware('web')
                    ->group(base_path('routes/app.php'));
            }
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
