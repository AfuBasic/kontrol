<?php

namespace App\Events\Admin;

use App\Models\Collection;
use App\Support\Queues;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CollectionPublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Collection $collection,
        public int $targetCount
    ) {}

    public function broadcastQueue(): string
    {
        return Queues::CRITICAL;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('estates.'.$this->collection->estate_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'collection.published';
    }

    public function broadcastWith(): array
    {
        return [
            'collection_id' => $this->collection->id,
            'collection_ulid' => $this->collection->ulid,
            'title' => $this->collection->name,
            'target_count' => $this->targetCount,
            'message' => "Collection '{$this->collection->name}' has been successfully published to {$this->targetCount} resident(s).",
        ];
    }
}
