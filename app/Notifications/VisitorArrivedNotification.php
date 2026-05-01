<?php

namespace App\Notifications;

use App\Channels\TelegramChannel;
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

        // Add Telegram channel if user has Telegram linked
        if ($notifiable->hasTelegramLinked()) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $estateName = $this->accessCode->estate?->name ?? 'Your Estate';
        $visitorName = $this->accessCode->visitor_name;
        $code = $this->accessCode->code;

        $message = $visitorName
            ? "{$visitorName} has arrived at the security post."
            : "Your visitor with code {$code} has arrived at the security post.";

        return [
            'title' => 'Visitor Arrived',
            'message' => $message,
            'access_code' => $code,
            'visitor_name' => $visitorName ?? 'Your visitor',
            'estate_name' => $estateName,
            'type' => 'visitor_arrived',
            'action_url' => '/resident/home',
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
                            'category' => 'visitor_arrived',
                        ],
                    ],
                ],
            ]);
    }

    /**
     * Get the telegram representation of the notification.
     *
     * @return array{text: string, keyboard?: array}
     */
    public function toTelegram(object $notifiable): array
    {
        $visitorName = $this->accessCode->visitor_name;
        $code = $this->accessCode->code;
        $address = $this->accessCode->estate?->address;

        $description = $visitorName
            ? "<b>{$visitorName}</b> has arrived at the security post."
            : "Your visitor with code <code>{$code}</code> has arrived at the security post.";

        $text = "🔔 <b>Visitor Arrived</b>\n\n"
            ."Hi <b>{$notifiable->name}</b>,\n"
            ."{$description}\n\n"
            .($address ? "📍 Location: {$address}\n\n" : '')
            .'<i>Access granted via Security Terminal.</i>';

        return [
            'text' => $text,
        ];
    }
}
