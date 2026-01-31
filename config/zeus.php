<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Zeus Admin Credentials
    |--------------------------------------------------------------------------
    |
    | These credentials are used to authenticate access to the Zeus admin
    | panel. Set these values in your .env file. Never commit real
    | credentials to version control.
    |
    */

    'username' => env('ZEUS_USERNAME'),
    'password' => env('ZEUS_PASSWORD'),

    /*
    |--------------------------------------------------------------------------
    | Zeus Session Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Zeus session handling. The session key is used to
    | store the authenticated state in the session.
    |
    */

    'session_key' => 'zeus_authenticated',

];
