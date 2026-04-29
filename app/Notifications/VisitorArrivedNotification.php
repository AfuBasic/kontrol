<?php

namespace App\Notifications;

use App\Models\AccessCode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources as Fcm;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class VisitorArrivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public AccessCode $accessCode
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        // Add WebPush channel if user has push subscriptions
        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        // Add FCM channel if user has FCM token
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
        $estateName = $this->accessCode->estate?->name ?? 'Your Estate';
        $visitorName = $this->accessCode->name ?? 'A visitor';

        return [
            'title' => 'Visitor Arrived',
            'message' => "{$visitorName} has arrived at the gate of {$estateName}.",
            'access_code' => $this->accessCode->code,
            'visitor_name' => $visitorName,
            'estate_name' => $estateName,
            'type' => 'visitor_arrived',
            'action_url' => '/resident',
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
                'action_url' => '/resident',
                'access_code_id' => (string) $this->accessCode->id,
                'type' => 'visitor_arrived',
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
            ]);
    }
}
