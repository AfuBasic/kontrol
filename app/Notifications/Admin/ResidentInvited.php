<?php

namespace App\Notifications\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class ResidentInvited extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $resident,
        public string $estateName,
        public string $inviterName
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Resident Invited',
            'message' => "{$this->resident->name} was invited to join {$this->estateName} by {$this->inviterName}.",
            'resident_name' => $this->resident->name,
            'inviter_name' => $this->inviterName,
            'type' => 'success',
            'action_url' => '/admin/residents',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
