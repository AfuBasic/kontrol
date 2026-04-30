<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources as Fcm;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class ResidentInvitedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $estateName,
        public string $inviterName,
        public string $role = 'resident'
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Estate Invitation',
            'message' => "You have been invited by {$this->inviterName} to join {$this->estateName} as a {$this->role}.",
            'estate_name' => $this->estateName,
            'inviter_name' => $this->inviterName,
            'role' => $this->role,
            'type' => 'estate_invitation',
            'action_url' => '/admin/residents',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $data = $this->toArray($notifiable);

        return (new WebPushMessage)
            ->title($data['title'])
            ->body($data['message'])
            ->data(['url' => $data['action_url']])
            ->badge('/assets/images/icon.png')
            ->icon('/assets/images/icon.png');
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $data = $this->toArray($notifiable);

        return FcmMessage::create()
            ->data([
                'title' => (string) $data['title'],
                'body' => (string) $data['message'],
                'action_url' => '/admin/residents',
                'type' => $data['type'],
            ])
            ->notification(Fcm\Notification::create()
                ->title($data['title'])
                ->body($data['message'])
            )
            ->android([
                'priority' => 'high',
                'notification' => [
                    'title' => $data['title'],
                    'body' => $data['message'],
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
                                'title' => $data['title'],
                                'body' => $data['message'],
                            ],
                            'sound' => 'default',
                            'badge' => 1,
                        ],
                    ],
                ],
            ]);
    }
}
