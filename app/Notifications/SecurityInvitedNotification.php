<?php

namespace App\Notifications;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SecurityInvitedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $security,
        public Estate $estate,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New Security Personnel Invited',
            'message' => "{$this->security->name} has been invited to {$this->estate->name} as security",
            'security_id' => $this->security->id,
            'security_name' => $this->security->name,
            'estate_id' => $this->estate->id,
            'estate_name' => $this->estate->name,
        ];
    }
}
