<?php

namespace App\Events\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class ResidentCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public Estate $estate,
        public bool $isPasswordReset = false,
    ) {}

    public function broadcastOn(): array
    {
        // Broadcast to the estate's admin channel
        // Since we don't have a specific group for all admins of an estate yet that is easily accessible without logic,
        // let's broadcast to the specific user channel of the current user (if we want to notify *just* the actor - but that's local)
        // OR better: broadcast to a channel for the estate that admins listen to.
        // Let's assume admins listen to `estates.{id}`
        return [
            new PrivateChannel('estates.' . $this->estate->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->isPasswordReset
                ? "Password reset initiated for {$this->user->name}"
                : "New resident invited: {$this->user->name}",
            'type' => $this->isPasswordReset ? 'info' : 'success',
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
        ];
    }

    public function broadcastAs(): string
    {
        return 'resident.created';
    }
}
