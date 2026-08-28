<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Trusted Device Cookie
    |--------------------------------------------------------------------------
    |
    | Server-issued device trust credential. The raw token lives only in this
    | cookie (encrypted by Laravel). The database stores HASH(token).
    |
    */

    'cookie' => env('DEVICE_TRUST_COOKIE', 'kontrol_device_trust'),

    'cookie_lifetime_minutes' => (int) env('DEVICE_TRUST_COOKIE_MINUTES', 60 * 24 * 365),

    /*
    |--------------------------------------------------------------------------
    | Trust Inactivity Window
    |--------------------------------------------------------------------------
    |
    | A trusted device that has not been used for this many days must complete
    | new-device authorization again. The cookie may still be present.
    |
    */

    'inactivity_days' => (int) env('DEVICE_TRUST_INACTIVITY_DAYS', 180),

    /*
    |--------------------------------------------------------------------------
    | Authorization Challenge
    |--------------------------------------------------------------------------
    */

    'authorization_ttl_minutes' => (int) env('DEVICE_AUTHORIZATION_TTL_MINUTES', 120),

    'pending_cookie' => env('DEVICE_PENDING_COOKIE', 'kontrol_pending_auth'),

    'resend_per_hour' => (int) env('DEVICE_AUTHORIZATION_RESEND_PER_HOUR', 3),

    /*
    |--------------------------------------------------------------------------
    | Failed Authentication Detection
    |--------------------------------------------------------------------------
    |
    | A security event is recorded only after this many failed OTP attempts
    | in the window - not on every typo.
    |
    */

    'failed_attempt_threshold' => (int) env('DEVICE_TRUST_FAILED_ATTEMPT_THRESHOLD', 5),

    'failed_attempt_window_minutes' => (int) env('DEVICE_TRUST_FAILED_ATTEMPT_WINDOW', 15),

    /*
    |--------------------------------------------------------------------------
    | Pending Authorization Retention
    |--------------------------------------------------------------------------
    |
    | Terminal (approved/denied/consumed/expired) authorization rows older
    | than this are pruned. Security events are never pruned by this job.
    |
    */

    'authorization_retention_days' => (int) env('DEVICE_AUTHORIZATION_RETENTION_DAYS', 30),

];
