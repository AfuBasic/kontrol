<?php

namespace App\Http\Controllers\Resident;

use App\Events\SosTriggered;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessSOSAlert;
use App\Models\SosEvent;
use App\Notifications\Resident\SosResponderNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

class SosController extends Controller
{
    /**
     * Trigger an SOS alert.
     */
    public function trigger(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $estate = $user->getCurrentEstate();

        // Rate Limiting: 1 per 60s, 3 per 10m
        $executed = RateLimiter::attempt(
            'sos-trigger:'.$user->id,
            1,
            function () {},
            60
        );

        if (! $executed) {
            return back()->withErrors(['error' => 'Please wait before triggering another SOS.']);
        }

        $executedTenMin = RateLimiter::attempt(
            'sos-trigger-long:'.$user->id,
            3,
            function () {},
            600
        );

        if (! $executedTenMin) {
            return back()->withErrors(['error' => 'Maximum SOS attempts reached for now.']);
        }

        $sosEvent = SosEvent::create([
            'user_id' => $user->id,
            'estate_id' => $estate->id,
            'triggered_at' => now(),
            'status' => 'initiated',
        ]);

        // Immediate Broadcast (for Security Dashboard)
        broadcast(new SosTriggered($sosEvent));

        // Queue processing (SMS, etc.)
        ProcessSOSAlert::dispatch($sosEvent);

        $subject = $user;
        if ($user->isHouseholdMember() && $user->householdOf) {
            $subject = $user->householdOf->primaryResident;
        }

        return back()->with('sos_success', [
            'id' => '#'.now()->getTimestamp(),
            'time' => now()->format('H:i • M d, Y'),
            'has_emergency_contacts' => $subject->emergencyContacts()->exists(),
        ]);
    }

    /**
     * Acknowledge an SOS alert (Security only).
     */
    public function acknowledge(SosEvent $sosEvent)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Ensure user is authorized for this estate and has correct role
        if (! $user->hasRole(['security', 'admin']) || $user->getCurrentEstateId() !== $sosEvent->estate_id) {
            abort(403);
        }

        $sosEvent->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
            'acknowledged_by' => $user->id,
        ]);

        // Notify the resident that help is on the way
        $resident = $sosEvent->user;
        $resident->notify(new SosResponderNotification($sosEvent));

        return back()->with('success', 'SOS alert acknowledged');
    }
}
