<?php

use App\Http\Middleware\CheckEstateFeature;
use App\Http\Middleware\EnsureResidentSubscriptionActive;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectIfAuthenticated;
use App\Http\Middleware\ResolveContext;
use App\Http\Middleware\ValidateCsrfToken;
use App\Http\Middleware\ValidateEstateContext;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as BaseValidateCsrfToken;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\InvalidSignatureException;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Sentry\Laravel\Integration;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

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
                $host = request()->getHost();
                $appDomain = config('domains.app');
                $rootDomain = config('domains.root');

                $publicDomain = ($host !== $appDomain && str_ends_with($host, $rootDomain))
                    ? $host
                    : $rootDomain;

                Route::domain($publicDomain)
                    ->middleware('web')
                    ->group(base_path('routes/public.php'));

                Route::domain($appDomain)
                    ->middleware('web')
                    ->group(base_path('routes/app.php'));
            } elseif ($domainRoutingEnabled && $isLocal && config('domains.app_subdomain')) {
                // Local with subdomain simulation (e.g., app.usekontrol.test)
                $host = request()->getHost();
                $appDomain = config('domains.app');
                $rootDomain = config('domains.root');

                $publicDomain = ($host !== $appDomain && str_ends_with($host, $rootDomain))
                    ? $host
                    : $rootDomain;

                Route::domain($publicDomain)
                    ->middleware('web')
                    ->group(base_path('routes/public.php'));

                Route::domain($appDomain)
                    ->middleware('web')
                    ->group(base_path('routes/app.php'));
            } else {
                // Local fallback: Load all routes without domain restrictions
                // Both public and app routes accessible on localhost/tunnel
                Route::middleware('web')
                    ->group(function () {
                        require base_path('routes/public.php');
                        require base_path('routes/app.php');
                    });

                Route::middleware('api')
                    ->prefix('api')
                    ->group(base_path('routes/api.php'));
            }
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(
            append: [
                AuthenticateSession::class,
                ResolveContext::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ],
            replace: [
                BaseValidateCsrfToken::class => ValidateCsrfToken::class,
            ]
        );
        $middleware->trustProxies('*');
        $middleware->validateCsrfTokens(except: [
            'telegram/webhook',
            'webhooks/paystack',
        ]);
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'guest' => RedirectIfAuthenticated::class,
            'permission' => PermissionMiddleware::class,
            'resident.active' => EnsureResidentSubscriptionActive::class,
            'feature' => CheckEstateFeature::class,
            'check-estate-feature' => CheckEstateFeature::class,
            'validate-estate' => ValidateEstateContext::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);

        $exceptions->render(function (TokenMismatchException $e, Request $request) {
            return back()->with('error', 'Your session expired. Please try again.');
        });

        $exceptions->render(function (InvalidSignatureException $e, Request $request) {
            if (str_starts_with($request->path(), 'invitation')) {
                return redirect()->route('invitation.invalid');
            }
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($e instanceof AuthenticationException || $e instanceof ValidationException) {
                return null;
            }

            if ($request->expectsJson()) {
                return null;
            }

            $statusCode = $e instanceof HttpExceptionInterface
                ? $e->getStatusCode()
                : 500;

            if (in_array($statusCode, [500, 503, 404, 403, 419])) {
                return Inertia::render('Error', [
                    'status' => $statusCode,
                    'errorDetails' => [
                        'message' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => substr($e->getTraceAsString(), 0, 1000),
                    ],
                ])
                    ->toResponse($request)
                    ->setStatusCode($statusCode);
            }

            return null;
        });
    })->create();
