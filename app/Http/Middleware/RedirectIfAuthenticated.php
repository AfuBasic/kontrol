<?php

namespace App\Http\Middleware;

use App\Actions\Auth\DetermineUserRedirect;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    public function __construct(
        protected DetermineUserRedirect $determineRedirect
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $redirectUrl = $this->determineRedirect->execute(Auth::user());

            return redirect($redirectUrl);
        }

        return $next($request);
    }
}
