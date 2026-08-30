<?php

use App\Http\Middleware\CheckEstateFeature;
use App\Http\Middleware\EnsureResidentSubscriptionActive;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectIfAuthenticated;
use App\Http\Middleware\ResolveContext;
use App\Http\Middleware\ValidateCsrfToken;
use App\Http\Middleware\ValidateEstateContext;
use App\Http\Middleware\Zeus\BlockSensitiveDuringImpersonation;
use App\Http\Middleware\Zeus\ResolveImpersonationContext;
use App\Models\SystemErrorLog;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as BaseValidateCsrfToken;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\InvalidSignatureException;
use Illuminate\Routing\Middleware\SubstituteBindings;
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
            // Global healthcheck route for uptime and network quality monitor pings
            Route::get('/up', fn () => response('OK', 200));

            $domainRoutingEnabled = config('domains.routing_enabled', true);
            $isLocal = app()->environment('local');
            $useDomainRouting = $domainRoutingEnabled && (! $isLocal || filled(config('domains.app_subdomain')));

            /*
            |------------------------------------------------------------------
            | Domain-Based Routing
            |------------------------------------------------------------------
            |
            | Register domains from config only - never from request()->getHost().
            | Request-derived domains break php artisan route:cache (CLI has no
            | Host header), which is what made www.usekontrol.com 404 in production.
            |
            | PUBLIC domains (root + www): Marketing routes
            | APP domain (app.*): Application routes
            |
            */

            if ($useDomainRouting) {
                $appDomain = config('domains.app');

                // Static public hosts (apex + www alias). Safe under route:cache.
                $publicDomains = collect([
                    config('domains.root'),
                    config('domains.www'),
                ])
                    ->filter(fn (?string $domain): bool => filled($domain) && $domain !== $appDomain)
                    ->unique()
                    ->values();

                $isPrimaryPublicDomain = true;

                foreach ($publicDomains as $publicDomain) {
                    $group = Route::domain($publicDomain)->middleware('web');

                    // Canonical route names stay on the primary (root) domain only.
                    // Alias domains get a name prefix so route:cache does not fail
                    // on duplicate named routes (landing.home, etc.).
                    if (! $isPrimaryPublicDomain) {
                        $group->name('www.');
                    }

                    $group->group(base_path('routes/public.php'));
                    $isPrimaryPublicDomain = false;
                }

                Route::domain($appDomain)
                    ->middleware('web')
                    ->group(base_path('routes/app.php'));

                Route::domain($appDomain)
                    ->middleware('api')
                    ->prefix('api')
                    ->group(base_path('routes/api.php'));
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
                ResolveImpersonationContext::class,
                BlockSensitiveDuringImpersonation::class,
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
            'api/*',
            'api/v1/client-errors',
            'zeus/impersonation/stop',
            'zeus/estates/*/impersonate',
        ]);
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'guest' => RedirectIfAuthenticated::class,
            'permission' => PermissionMiddleware::class,
            'resident.active' => EnsureResidentSubscriptionActive::class,
            'feature' => CheckEstateFeature::class,
            'check-estate-feature' => CheckEstateFeature::class,
            'validate-estate' => ValidateEstateContext::class,
            'zeus.impersonation' => ResolveImpersonationContext::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);

        $exceptions->render(function (TokenMismatchException $e, Request $request) {
            return back()->with('error', 'Your session expired. Please try again.');
        });

        $exceptions->reportable(function (Throwable $e) {
            // Ignore noise: standard auth, validation, CSRF, and 4xx client errors
            if ($e instanceof AuthenticationException
                || $e instanceof ValidationException
                || $e instanceof TokenMismatchException
                || ($e instanceof HttpExceptionInterface && $e->getStatusCode() < 500)) {
                return;
            }

            try {
                $request = request();
                $user = $request?->user();
                $context = [
                    'url' => $request?->fullUrl(),
                    'method' => $request?->method(),
                    'ip' => $request?->ip(),
                    'user_agent' => $request?->userAgent(),
                    'user_id' => $user?->id,
                    'user_email' => $user?->email,
                    'estate_id' => $user?->current_estate_id ?? session('estate_id') ?? null,
                ];

                SystemErrorLog::record($e, 'backend', $context);
            } catch (Throwable) {
                // Silently bypass to avoid breaking the core exception flow
            }
        });

        $exceptions->render(function (InvalidSignatureException $e, Request $request) {
            if (str_starts_with($request->path(), 'invitation')) {
                return redirect()->route('invitation.invalid');
            }

            if (str_starts_with($request->path(), 'device-authorization')) {
                return Inertia::render('Auth/DeviceLinkInvalid', [
                    'reason' => 'expired',
                ])->toResponse($request)->setStatusCode(403);
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
