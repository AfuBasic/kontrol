<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources as Fcm;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class TestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $title = 'Test Notification',
        public string $message = 'This is a test notification from Kontrol'
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => 'test',
            'action_url' => '/resident/home',
        ];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->body($this->message)
            ->icon('/assets/images/icon.png')
            ->badge('/assets/images/icon.png')
            ->data(['url' => '/resident/home']);
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return FcmMessage::create()
            ->data([
                'title' => $this->title,
                'body' => $this->message,
                'type' => 'test',
                'action_url' => '/resident/home',
            ])
            ->notification(Fcm\Notification::create()
                ->title($this->title)
                ->body($this->message)
            )
            ->android([
                'priority' => 'high',
                'notification' => [
                    'title' => $this->title,
                    'body' => $this->message,
                    'color' => '#0A3D91',
                    'sound' => 'default',
                    'channel_id' => 'kontrol_v1_alerts',
                ],
            ])
            ->custom([
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $this->title,
                                'body' => $this->message,
                            ],
                            'sound' => 'default',
                            'badge' => 1,
                        ],
                    ],
                ],
            ]);
    }
}
