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
        return [
            'id' => $this->sosEvent->id,
            'resident_name' => $this->sosEvent->user->name,
            'address' => $this->sosEvent->user->profile?->address ?? 'N/A',
            'estate_name' => $this->sosEvent->estate->name,
            'triggered_at' => $this->sosEvent->triggered_at->toIso8601String(),
            'emergency_contacts' => $this->sosEvent->user->emergencyContacts->map(fn ($c) => [
                'name' => $c->name,
                'phone' => $c->phone,
            ]),
        ];
    }
}
