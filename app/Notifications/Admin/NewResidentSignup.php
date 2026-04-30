<?php

namespace App\Notifications\Admin;

use App\Channels\TelegramChannel;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

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
        $channels = ['database', 'broadcast', 'mail'];

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        if ($notifiable->telegram_chat_id) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return (new FcmMessage(notification: new FcmNotification(
            title: 'New Resident Request',
            body: "{$this->resident->name} is requesting to join {$this->estateName}.",
        )))
            ->data(['url' => route('admin.residents.approvals.index')])
            ->custom([
            'android' => [
                'notification' => [
                    'click_action' => 'TOP_STORY_ACTIVITY',
                ],
            ],
            'apns' => [
                'payload' => [
                    'aps' => [
                        'badge' => $notifiable->unreadNotifications()->count(),
                        'sound' => 'default',
                    ],
                ],
            ],
        ]);
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
    /**
     * Get the Telegram representation of the notification.
     *
     * @return array{text: string, keyboard?: array}
     */
    public function toTelegram(object $notifiable): array
    {
        $text = "👤 <b>New Resident Request</b>\n\n"
            ."<b>Name:</b> {$this->resident->name}\n"
            ."<b>Estate:</b> {$this->estateName}\n"
            ."<b>Email:</b> {$this->resident->email}\n\n"
            ."Please review and approve this request in the admin portal.";

        return [
            'text' => $text,
        ];
    }
}
