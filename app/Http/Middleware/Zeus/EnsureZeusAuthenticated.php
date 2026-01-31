<?php

namespace App\Http\Middleware\Zeus;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureZeusAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get(config('zeus.session_key'))) {
            return redirect()->route('zeus.login');
        }

        return $next($request);
    }
}
