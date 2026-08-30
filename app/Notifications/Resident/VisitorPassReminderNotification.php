<?php

namespace App\Notifications\Resident;

use App\Channels\TelegramChannel;
use App\Models\AccessCode;
use App\Models\VisitorPassReminder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class VisitorPassReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public VisitorPassReminder $reminder,
        public AccessCode $accessCode
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if (method_exists($notifiable, 'pushSubscriptions') && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        if (! empty($notifiable->fcm_token)) {
            $channels[] = FcmChannel::class;
        }

        if (method_exists($notifiable, 'hasTelegramLinked') && $notifiable->hasTelegramLinked()) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $visitorName = $this->accessCode->visitor_name ?? 'Your visitor';
        $tz = config('app.timezone', 'Africa/Lagos');
        $startTime = $this->accessCode->starts_at
            ? $this->accessCode->starts_at->timezone($tz)->format('g:i A')
            : 'soon';

        $offsetMinutes = $this->reminder->reminder_offset_minutes;
        $offsetText = match ($offsetMinutes) {
            1440 => '24 hours',
            720 => '12 hours',
            360 => '6 hours',
            120 => '2 hours',
            60 => '1 hour',
            default => "{$offsetMinutes} minutes",
        };

        $message = "{$visitorName}'s pass becomes valid at {$startTime} today (in {$offsetText}).";

        return [
            'title' => 'Visitor arriving soon',
            'message' => $message,
            'access_code_id' => $this->accessCode->id,
            'visitor_name' => $visitorName,
            'type' => 'visitor_reminder',
            'target_role' => 'resident',
            'action_url' => "/resident/visitors/{$this->accessCode->id}",
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
            ->data(['url' => $data['action_url'], 'type' => $data['type']])
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
                'action_url' => (string) $data['action_url'],
                'access_code_id' => (string) $this->accessCode->id,
                'type' => 'visitor_reminder',
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
                            'category' => 'visitor_reminder',
                        ],
                    ],
                ],
            ]);
    }

    /**
     * @return array{text: string}
     */
    public function toTelegram(object $notifiable): array
    {
        $data = $this->toArray($notifiable);

        $text = "🔔 <b>{$data['title']}</b>\n\n"
            ."Hi <b>{$notifiable->name}</b>,\n"
            ."{$data['message']}\n\n"
            .'<i>Tap in your Kontrol app to view scheduled pass details.</i>';

        return [
            'text' => $text,
        ];
    }
}
