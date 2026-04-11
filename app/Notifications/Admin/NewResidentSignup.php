<?php

namespace App\Notifications\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class NewResidentSignup extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Delete the job if the models are no longer available.
     */
    public bool $deleteWhenMissingModels = true;

    public function __construct(
        public User $resident,
        public string $estateName
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
            ->subject("New Resident Sign-up - {$this->estateName}")
            ->view('mail.admin.new-resident-signup', [
                'estateName' => $this->estateName,
                'residentName' => $this->resident->name,
                'residentEmail' => $this->resident->email,
                'url' => route('admin.residents.approvals.index'),
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
            'title' => 'New Resident Request',
            'message' => "{$this->resident->name} has requested to join {$this->estateName}.",
            'action_url' => route('admin.residents.approvals.index'),
            'type' => 'info',
        ];
    }
}
