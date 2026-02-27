<?php

namespace App\Events\Resident;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class HouseholdMemberCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public Estate $estate,
        public User $primaryResident,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('estates.' . $this->estate->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message' => "New household member added: {$this->user->name}",
            'type' => 'success',
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'primary_resident' => [
                'id' => $this->primaryResident->id,
                'name' => $this->primaryResident->name,
            ],
        ];
    }

    public function broadcastAs(): string
    {
        return 'household-member.created';
    }
}
