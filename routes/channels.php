<?php

use Illuminate\Support\Facades\Broadcast;

// Register broadcasting authentication routes
Broadcast::routes(['middleware' => ['web', 'auth']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('estates.{id}', function ($user, $id) {
    // Check if user belongs to the estate
    if (!$user->estates()->where('estates.id', $id)->exists()) {
        return false;
    }
    
    return true;
});
