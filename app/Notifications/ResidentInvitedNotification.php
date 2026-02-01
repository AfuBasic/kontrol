<?php

namespace App\Notifications;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ResidentInvitedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $resident,
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
            'title' => 'New Resident Invited',
            'message' => "{$this->resident->name} has been invited to {$this->estate->name}",
            'resident_id' => $this->resident->id,
            'resident_name' => $this->resident->name,
            'estate_id' => $this->estate->id,
            'estate_name' => $this->estate->name,
        ];
    }
}
