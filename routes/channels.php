<?php

use Illuminate\Support\Facades\Broadcast;

// Register broadcasting authentication routes
Broadcast::routes(['middleware' => ['web', 'auth']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('estates.{id}', function ($user, $id) {
    // Check if user belongs to the estate
    if (! $user->estates()->where('estates.id', $id)->exists()) {
        return false;
    }

    return true;
});

Broadcast::channel('estates.{id}.residents', function ($user, $id) {
    // Check if user is a resident of this estate
    if (! $user->estates()->where('estates.id', $id)->exists()) {
        return false;
    }

    // Set team context for Spatie Permission
    setPermissionsTeamId($id);

    return $user->hasRole('resident');
});

Broadcast::channel('estates.{id}.security', function ($user, $id) {
    // Check if user is security for this estate
    if (! $user->estates()->where('estates.id', $id)->exists()) {
        return false;
    }

    // Set team context for Spatie Permission
    setPermissionsTeamId($id);

    return $user->hasRole('security');
});
