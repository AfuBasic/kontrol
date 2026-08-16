<?php

namespace App\Events\Incidents;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use App\Models\Incident;

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

        // If scoped to a specific zone:
        if ($zoneId !== null) {
            return [
                new PrivateChannel("estates.{$estateId}.zones.{$zoneId}.residents"),
                new PrivateChannel("estates.{$estateId}"),
            ];
        }

        // Entire estate broadcast:
        return [
            new PrivateChannel("estates.{$estateId}.residents"),
            new PrivateChannel("estates.{$estateId}"),
        ];
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
