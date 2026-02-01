<?php

namespace App\Notifications\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ResidentAcceptedInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $resident)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => "Resident {$this->resident->name} has accepted the invitation.",
            'action_url' => route('residents.index'),
            'type' => 'success',
        ];
    }
}
