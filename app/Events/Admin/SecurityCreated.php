<?php

namespace App\Events\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SecurityCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public Estate $estate,
        public bool $isPasswordReset = false,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('estates.'.$this->estate->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->isPasswordReset
                ? "Password reset initiated for {$this->user->name}"
                : "New security personnel invited: {$this->user->name}",
            'type' => $this->isPasswordReset ? 'info' : 'success',
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
        ];
    }

    public function broadcastAs(): string
    {
        return 'security.created';
    }
}
