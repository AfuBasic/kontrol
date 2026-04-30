<?php

namespace App\Events;

use App\Models\SosEvent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SosTriggered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public SosEvent $sosEvent) {}

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'sos.triggered';
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('estates.'.$this->sosEvent->estate_id.'.security'),
        ];
    }

    public function broadcastWith(): array
    {
        $user = $this->sosEvent->user;
        $subject = $user;

        if ($user->isHouseholdMember() && $user->householdOf) {
            $subject = $user->householdOf->primaryResident;
        }

        return [
            'id' => $this->sosEvent->id,
            'resident_name' => $user->name, // Keep the trigger's name
            'resident_phone' => $user->profile?->phone ?? 'N/A',
            'address' => $subject->profile?->address ?? 'N/A',
            'estate_name' => $this->sosEvent->estate->name,
            'triggered_at' => $this->sosEvent->triggered_at->toIso8601String(),
            'emergency_contacts' => $subject->emergencyContacts->map(fn ($c) => [
                'name' => $c->name,
                'phone' => $c->phone,
            ]),
        ];
    }
}
