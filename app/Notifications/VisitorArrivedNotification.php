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
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
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

        if ($this->accessCode->type === 'event') {
            $eventName = $this->accessCode->visitor_name;
            $guestLimit = $this->accessCode->guest_limit;
            $arrivedCount = $this->accessCode->accessLogs()->count();

            if ($eventName) {
                if ($guestLimit) {
                    $message = "A guest has arrived for the event {$eventName}. {$arrivedCount} out of {$guestLimit} expected guests have arrived.";
                } else {
                    $message = "A guest has arrived for the event {$eventName}. Guest number {$arrivedCount} has arrived.";
                }
            } else {
                if ($guestLimit) {
                    $message = "A guest has arrived for your event. {$arrivedCount} out of {$guestLimit} expected guests have arrived.";
                } else {
                    $message = "A guest has arrived for your event. Guest number {$arrivedCount} has arrived.";
                }
            }
        } else {
            $message = $visitorName
                ? "{$visitorName} has arrived at the security post."
                : "Your visitor with code {$code} has arrived at the security post.";
        }

        return [
            'title' => 'Visitor Arrived',
            'message' => $message,
            'access_code' => $code,
            'visitor_name' => $visitorName ?? 'Your visitor',
            'estate_name' => $estateName,
            'type' => 'visitor_arrived',
            'target_role' => 'resident',
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
            ->notification(FcmNotification::create()
                ->title($data['title'])
                ->body($data['message'])
            )
            ->data([
                'title' => (string) $data['title'],
                'body' => (string) $data['message'],
                'action_url' => '/resident',
                'access_code_id' => (string) $this->accessCode->id,
                'type' => 'visitor_arrived',
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'kontrol_v1_alerts',
                        'sound' => 'default',
                        'color' => '#0A3D91',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $data['title'],
                                'body' => $data['message'],
                            ],
                            'sound' => 'default',
                            'badge' => $notifiable->unreadNotifications()->count(),
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

        if ($this->accessCode->type === 'event') {
            $eventName = $this->accessCode->visitor_name;
            $guestLimit = $this->accessCode->guest_limit;
            $arrivedCount = $this->accessCode->accessLogs()->count();

            if ($eventName) {
                if ($guestLimit) {
                    $description = "A guest has arrived for the event <b>{$eventName}</b>. <b>{$arrivedCount}</b> out of <b>{$guestLimit}</b> expected guests have arrived.";
                } else {
                    $description = "A guest has arrived for the event <b>{$eventName}</b>. Guest number <b>{$arrivedCount}</b> has arrived.";
                }
            } else {
                if ($guestLimit) {
                    $description = "A guest has arrived for your event. <b>{$arrivedCount}</b> out of <b>{$guestLimit}</b> expected guests have arrived.";
                } else {
                    $description = "A guest has arrived for your event. Guest number <b>{$arrivedCount}</b> has arrived.";
                }
            }
        } else {
            $description = $visitorName
                ? "<b>{$visitorName}</b> has arrived at the security post."
                : "Your visitor with code <code>{$code}</code> has arrived at the security post.";
        }

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
