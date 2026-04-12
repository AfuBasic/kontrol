<?php

namespace App\Notifications;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

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
        $channels = ['database'];

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
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
            'type' => 'info',
        ];
    }

    /**
     * Get the FCM notification representation.
     */
    public function toFcm(object $notifiable): FcmMessage
    {
        $data = $this->toArray($notifiable);

        return (new FcmMessage(
            notification: new FcmNotification(
                title: $data['title'],
                body: $data['message'],
            )
        ))
        ->data([
            'action_url' => '/admin/residents',
            'type' => $data['type'],
        ])
        ->custom([
            'android' => [
                'notification' => [
                    'color' => '#0A3D91',
                    'sound' => 'default',
                ],
            ],
            'apns' => [
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Get the WebPush representation of the notification.
     */
    public function toWebPush(object $notifiable): WebPushMessage
    {
        $data = $this->toArray($notifiable);

        return (new WebPushMessage)
            ->title($data['title'])
            ->body($data['message'])
            ->action('View Residents', '/admin/residents')
            ->data(['action_url' => '/admin/residents'])
            ->options([
                'vibrate' => [100, 50, 100],
            ]);
    }
}
