<?php

namespace App\Http\Middleware;

use App\Auth\ContextManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveContext
{
    public function __construct(private ContextManager $contextManager)
    {
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Resolve the authoritative context for this request.
        // It will automatically validate session variables, models, estates, and zones.
        // If successful, it establishes Spatie's team state and invalidates any cached permissions.
        $this->contextManager->resolve($request);

        return $next($request);
    }
}
