<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity as SpatieActivity;


class Activity extends SpatieActivity
{
    public static function booted() {
        static::creating(function($activity) {
            $activity->estate_id = Auth::user()->estates()->wherePivot('status', 'accepted')->first()->id;
        });
    }
}
