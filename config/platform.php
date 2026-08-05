<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Role Categories
    |--------------------------------------------------------------------------
    |
    | Define role categories. New roles can be added here without modifying
    | application logic.
    |
    */
    'role_categories' => [
        'administrative' => [
            'admin',
            'super_admin',
            'estate_admin',
            'estate_manager',
            'affiliate',
        ],
        'operational' => [
            'resident',
            'property_owner',
            'household_member',
            'security',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Platform Access Policy Matrix
    |--------------------------------------------------------------------------
    |
    | Define permitted execution environments per role category.
    |
    */
    'platform_policy' => [
        'administrative' => [
            'desktop_browser' => true,
            'mobile_browser' => true,
            'ios_browser' => true,
            'android_browser' => true,
            'installed_pwa' => true,
            'native_app' => true,
        ],
        'operational' => [
            'desktop_browser' => true,
            'mobile_browser' => true,
            'ios_browser' => false,
            'android_browser' => true,
            'installed_pwa' => true,
            'native_app' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Exempt Routes
    |--------------------------------------------------------------------------
    |
    | Patterns for routes that bypass platform policy checks (e.g. web payments).
    |
    */
    'exempt_routes' => [
        'resident/billing*',
        'billing*',
        'resident/coupons*',
        'platform/*',
        'download-app',
    ],

    /*
    |--------------------------------------------------------------------------
    | Android Migration Configuration
    |--------------------------------------------------------------------------
    |
    | Toggle when the native Android application becomes available on Google Play.
    |
    */
    'android_native_available' => false,

    'app_store_url' => 'https://apps.apple.com/ng/app/access-kontrol/id6772562083',
    'play_store_url' => 'https://play.google.com/store/apps/details?id=com.kontrol.hq',
];
