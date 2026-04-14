<?php

namespace App\Notifications;

use App\Channels\TelegramChannel;
use App\Enums\TelegramCallbackAction;
use App\Models\AccessCode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

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
        $channels = ['database'];

        // Add WebPush channel if user has push subscriptions
        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        // Add FCM channel if user has an FCM token
        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        // Add Telegram channel if user has Telegram linked
        if ($notifiable->telegram_chat_id) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    /**
     * Get the web push notification representation.
     */
    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $estateName = $this->accessCode->estate?->name ?? 'Your Estate';
        $visitorName = $this->accessCode->visitor_name ?? 'A visitor';
        $securityName = $this->accessCode->verifiedBy?->name ?? 'Security';

        return (new WebPushMessage)
            ->title($estateName)
            ->body("The access code issued for {$visitorName} has just been validated by {$securityName}")
            ->icon('/assets/images/app-icon.png')
            ->badge('/assets/images/app-icon.png')
            ->tag('visitor-arrived-'.$this->accessCode->id)
            ->data([
                'url' => '/resident',
                'access_code_id' => $this->accessCode->id,
                'visitor_name' => $this->accessCode->visitor_name,
            ])
            ->options([
                'TTL' => 300, // Time to live in seconds (5 minutes)
                'urgency' => 'high',
            ]);
    }

    /**
     * Get the Telegram notification representation.
     *
     * @return array{text: string, keyboard?: array<int, array<int, array{text: string, callback_data: string}>>}
     */
    public function toTelegram(object $notifiable): array
    {
        $estateName = $this->accessCode->estate?->name ?? 'Your Estate';
        $visitorName = $this->accessCode->visitor_name ?? 'A visitor';
        $securityName = $this->accessCode->verifiedBy?->name ?? 'Security';
        $time = now()->format('M j, Y g:i A');

        $text = "<b>Visitor Arrived</b>\n\n";
        $text .= "<b>Estate:</b> {$estateName}\n";
        $text .= "<b>Visitor:</b> {$visitorName}\n";
        $text .= "<b>Code:</b> <code>{$this->accessCode->code}</code>\n";
        $text .= "<b>Verified by:</b> {$securityName}\n";
        $text .= "<b>Time:</b> {$time}";

        return [
            'text' => $text,
            'keyboard' => [
                [
                    ['text' => '📋 View My Codes', 'callback_data' => TelegramCallbackAction::ViewCodes->value],
                ],
            ],
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
            'action_url' => '/resident',
            'access_code_id' => (string) $this->accessCode->id,
            'type' => 'visitor_arrived',
        ])
        ->custom([
            'android' => [
                'notification' => [
                    'color' => '#0A3D91',
                    'sound' => 'default',
                    'icon' => 'notification_icon',
                ],
            ],
            'apns' => [
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                        'badge' => 1,
                    ],
                ],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $estateName = $this->accessCode->estate?->name ?? 'Your Estate';
        $visitorName = $this->accessCode->visitor_name ?? 'A visitor';
        $securityName = $this->accessCode->verifiedBy?->name ?? 'Security';

        return [
            'title' => 'Access code validated',
            'message' => "The access code issued for {$visitorName} has just been validated by {$securityName}",
            'estate_name' => $estateName,
            'access_code_id' => $this->accessCode->id,
            'visitor_name' => $this->accessCode->visitor_name,
            'code' => $this->accessCode->code,
            'action_url' => '/resident/home',
            'type' => 'visitor_arrived',
        ];
    }
}
