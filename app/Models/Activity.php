<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Activity extends SpatieActivity
{
    protected static function booted(): void
    {
        static::creating(function ($activity): void {
            // Try to get estate_id from authenticated user
            if (Auth::check()) {
                $estate = Auth::user()->estates()->wherePivot('status', 'accepted')->first();
                if ($estate) {
                    $activity->estate_id = $estate->id;

                    return;
                }
            }

            // Fallback: try to get estate_id from the causer (for non-web contexts like Telegram)
            if ($activity->causer && method_exists($activity->causer, 'getCurrentEstate')) {
                try {
                    $activity->estate_id = $activity->causer->getCurrentEstate()->id;

                    return;
                } catch (\Throwable) {
                    // Causer has no estate
                }
            }

            // Fallback: try to get estate_id from the subject
            if ($activity->subject && isset($activity->subject->estate_id)) {
                $activity->estate_id = $activity->subject->estate_id;
            }
        });
    }
}
