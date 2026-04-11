<?php

namespace App\Notifications;

use App\Models\Estate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class ResidentApproved extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Delete the job if the models are no longer available.
     */
    public bool $deleteWhenMissingModels = true;

    public function __construct(
        public Estate $estate
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Welcome to {$this->estate->name}!")
            ->view('mail.resident.approved', [
                'name' => $notifiable->name,
                'estateName' => $this->estate->name,
                'url' => url('/login'),
            ]);
    }

    /**
     * Get the array representation of the notification (for database).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->notificationData();
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->notificationData());
    }

    /**
     * Get the notification data payload.
     *
     * @return array<string, mixed>
     */
    protected function notificationData(): array
    {
        return [
            'title' => 'Application Approved',
            'message' => "Your application to join {$this->estate->name} has been approved. Welcome!",
            'action_url' => url('/login'),
            'type' => 'success',
        ];
    }
}
