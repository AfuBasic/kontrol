<?php

namespace App\Providers;

use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Policies\EstateBoardCommentPolicy;
use App\Policies\EstateBoardPostPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
        $this->configureRateLimiting();

        // Allow admins to bypass all permission checks
        Gate::before(function ($user, $_ability) {
            if ($user && $user->hasRole('admin')) {
                return true;
            }
        });
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
}
