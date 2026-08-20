<?php

namespace App\Events\Incidents;

use App\Models\Incident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentCreatedBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Incident $incident
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $estateId = $this->incident->estate_id;
        $zoneId = $this->incident->zone_id;

        $channels = [];

        // Always notify the estate admins/staff channel
        $channels[] = new PrivateChannel("estates.{$estateId}");

        if (! $this->incident->is_private) {
            if ($zoneId !== null) {
                $channels[] = new PrivateChannel("estates.{$estateId}.zones.{$zoneId}.residents");
            } else {
                $channels[] = new PrivateChannel("estates.{$estateId}.residents");
            }
        }

        return $channels;
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $reporterName = $this->incident->reporter?->name ?? 'A resident';

        return [
            'incident' => [
                'id' => $this->incident->id,
                'hashid' => $this->incident->hashid,
                'title' => $this->incident->title,
                'body' => $this->incident->body,
                'category' => $this->incident->category,
                'priority' => $this->incident->priority,
                'zone_id' => $this->incident->zone_id,
            ],
            'message' => "'{$this->incident->title}' reported by {$reporterName}.",
        ];
    }

    public function broadcastAs(): string
    {
        return 'incident.created';
    }
}
