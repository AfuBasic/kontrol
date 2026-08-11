<?php

namespace App\Providers;

use App\Auth\ContextManager;
use App\Events\Billing\InvoiceGenerated;
use App\Events\Billing\PaymentReceived;
use App\Listeners\Billing\SendInvoiceEmail;
use App\Listeners\Billing\SendInvoiceGeneratedNotification;
use App\Listeners\Billing\SendPaymentReceivedNotification;
use App\Listeners\WarmEstateSettings;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Observers\PaymentObserver;
use App\Observers\PaymentTransactionObserver;
use App\Policies\EstateBoardCommentPolicy;
use App\Policies\EstateBoardPostPolicy;
use App\Policies\PartnerAssignmentPolicy;
use App\Policies\RolePolicy;
use App\Services\SMS\SMSProvider;
use App\Services\SMS\SmsService;
use App\Services\SMS\TermiiProvider;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SMSProvider::class, TermiiProvider::class);
        $this->app->singleton(SmsService::class, function ($app) {
            return new SmsService($app->make(SMSProvider::class));
        });

        $this->app->scoped(ContextManager::class, fn () => new ContextManager);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
        $this->registerObservers();
        $this->configureRateLimiting();
        $this->registerEventListeners();
        $this->configureTunnelSupport();

        // Force HTTPS unconditionally in production/staging to prevent Mixed Content redirect errors
        // in Capacitor WebViews, and conditionally for local proxies.
        if (app()->environment('production', 'staging')) {
            URL::forceScheme('https');
        } elseif (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            URL::forceScheme('https');
        }

    }

    protected function configureTunnelSupport(): void
    {
        if (app()->environment('local')) {
            $host = request()->getHost();

            // If the host is an Expose or Ngrok tunnel
            if (str_contains($host, 'sharedwithexpose.com') || str_contains($host, 'ngrok-free.app')) {
                $protocol = request()->isSecure() ? 'https://' : 'http://';
                $url = $protocol.$host;

                // Dynamically update app URL and Sanctum/CORS stateful domains
                config(['app.url' => $url]);

                $stateful = config('sanctum.stateful', []);
                if (! in_array($host, $stateful)) {
                    $stateful[] = $host;
                    config(['sanctum.stateful' => $stateful]);
                }
            }
        }
    }

    protected function registerPolicies(): void
    {
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(EstateBoardPost::class, EstateBoardPostPolicy::class);
        Gate::policy(EstateBoardComment::class, EstateBoardCommentPolicy::class);
        Gate::policy(Estate::class, PartnerAssignmentPolicy::class);
    }

    protected function registerObservers(): void
    {
        Payment::observe(PaymentObserver::class);
        PaymentTransaction::observe(PaymentTransactionObserver::class);
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('estate-board-posts', function ($request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('estate-board-enhance', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('estate-board-comments', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('incident-comments', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    protected function registerEventListeners(): void
    {
        Event::listen(InvoiceGenerated::class, SendInvoiceEmail::class);
        Event::listen(InvoiceGenerated::class, SendInvoiceGeneratedNotification::class);
        Event::listen(PaymentReceived::class, SendPaymentReceivedNotification::class);
        Event::listen(Login::class, WarmEstateSettings::class);
    }
}
