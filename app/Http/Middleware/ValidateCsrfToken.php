<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as BaseValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;

class ValidateCsrfToken extends BaseValidateCsrfToken
{
    /**
     * Handle an incoming request.
     *
     *
     * @throws TokenMismatchException
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->header('X-Capacitor-App') === 'true' || $request->cookie('is_native_app') === 'true') {
            return $next($request);
        }

        return parent::handle($request, $next);
    }
}
