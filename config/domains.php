<?php

/**
 * Domain Configuration
 *
 * Environment-driven domain configuration for multi-domain routing.
 * Never hardcode domains in route files - always reference these config values.
 *
 * Architecture:
 * - ROOT domain (usekontrol.com): Marketing site, landing pages, public content
 * - APP domain (app.usekontrol.com): Authenticated SaaS application
 *
 * Local Development:
 * - Option A: Use localhost without domain restrictions (automatic in local env)
 * - Option B: Configure hosts file for subdomain simulation:
 *     127.0.0.1 usekontrol.test
 *     127.0.0.1 app.usekontrol.test
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Root Domain
    |--------------------------------------------------------------------------
    |
    | The base domain for the marketing/public site.
    | Examples: usekontrol.com (production), usekontrol.test (local)
    |
    */
    'root' => env('APP_DOMAIN', 'localhost'),

    /*
    |--------------------------------------------------------------------------
    | App Subdomain
    |--------------------------------------------------------------------------
    |
    | The subdomain prefix for the authenticated application.
    | Set to empty string for localhost development without subdomains.
    |
    */
    'app_subdomain' => env('APP_SUBDOMAIN', 'app'),

    /*
    |--------------------------------------------------------------------------
    | Full App Domain
    |--------------------------------------------------------------------------
    |
    | Computed full domain for the application.
    | When APP_SUBDOMAIN is empty, this equals the root domain.
    |
    */
    'app' => env('APP_SUBDOMAIN', 'app')
        ? env('APP_SUBDOMAIN', 'app').'.'.env('APP_DOMAIN', 'localhost')
        : env('APP_DOMAIN', 'localhost'),

    /*
    |--------------------------------------------------------------------------
    | Domain Routing Enabled
    |--------------------------------------------------------------------------
    |
    | When false, domain restrictions are bypassed (useful for simple local dev).
    | Set to true when using subdomain simulation locally or in production.
    |
    */
    'routing_enabled' => env('DOMAIN_ROUTING_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Future Subdomains (reserved)
    |--------------------------------------------------------------------------
    |
    | Placeholder for future subdomain expansion:
    | - api.usekontrol.com
    | - admin.usekontrol.com
    | - docs.usekontrol.com
    |
    */
    // 'api' => env('API_SUBDOMAIN', 'api').'.'.env('APP_DOMAIN', 'localhost'),
    // 'admin' => env('ADMIN_SUBDOMAIN', 'admin').'.'.env('APP_DOMAIN', 'localhost'),
];
