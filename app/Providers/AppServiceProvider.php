<?php

namespace App\Providers;

use App\Events\Billing\InvoiceGenerated;
use App\Events\Billing\PaymentReceived;
use App\Listeners\Billing\SendInvoiceEmail;
use App\Listeners\Billing\SendInvoiceGeneratedNotification;
use App\Listeners\Billing\SendPaymentReceivedNotification;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Policies\EstateBoardCommentPolicy;
use App\Policies\EstateBoardPostPolicy;
use App\Services\SMS\BulkSmsNigeriaProvider;
use App\Services\SMS\SMSProvider;
use App\Services\SMS\SmsService;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SMSProvider::class, BulkSmsNigeriaProvider::class);
        $this->app->singleton(SmsService::class, function ($app) {
            return new SmsService($app->make(SMSProvider::class));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
        $this->configureRateLimiting();
        $this->registerEventListeners();
        $this->configureTunnelSupport();

        // Allow admins to bypass all permission checks
        Gate::before(function ($user, $_ability) {
            if ($user && $user->hasRole('admin')) {
                return true;
            }
        });
    }

    protected function configureTunnelSupport(): void
    {
        if (app()->environment('local')) {
            $host = request()->getHost();

            // If the host is an Expose or Ngrok tunnel
            if (str_contains($host, 'sharedwithexpose.com') || str_contains($host, 'ngrok-free.app')) {
                $protocol = request()->isSecure() ? 'https://' : 'http://';
                $url = $protocol . $host;

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
        Gate::policy(EstateBoardPost::class, EstateBoardPostPolicy::class);
        Gate::policy(EstateBoardComment::class, EstateBoardCommentPolicy::class);
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('estate-board-posts', function ($request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('estate-board-comments', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
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
    }
}
