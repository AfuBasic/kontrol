<?php

namespace App\Events\Resident;

use App\Models\AccessCode;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VisitorArrivedBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public AccessCode $accessCode
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.'.$this->user->id),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'title' => 'Visitor Arrived',
                'message' => ($this->accessCode->visitor_name ?? 'A visitor').' has arrived at the gate.',
                'access_code_id' => $this->accessCode->id,
                'visitor_name' => $this->accessCode->visitor_name,
                'code' => $this->accessCode->code,
            ],
            'unread_count' => $this->user->unreadNotifications()->count() + 1,
        ];
    }

    public function broadcastAs(): string
    {
        return 'visitor.arrived';
    }
}
