<?php

namespace App\Notifications\Incidents;

use App\Channels\TelegramChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class IncidentDeletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $incidentTitle,
        public string $estateName,
        public string $deleterName
    ) {}

    /**
     * Get the notification's delivery channels.
     *
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

        if ($notifiable->hasTelegramLinked()) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Incident Report Deleted',
            'message' => "The incident '{$this->incidentTitle}' was deleted by {$this->deleterName}.",
            'type' => 'incident_deleted',
            'action_url' => $notifiable->hasRole('admin') ? '/admin/incidents' : '/resident/incidents',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $data = $this->toArray($notifiable);

        return (new WebPushMessage)
            ->title($data['title'])
            ->body($data['message'])
            ->icon('/assets/images/app-icon.png')
            ->badge('/assets/images/app-icon.png')
            ->tag('incident-deleted-'.Str::random(8))
            ->data([
                'url' => $data['action_url'],
            ])
            ->options([
                'TTL' => 3600,
                'urgency' => 'normal',
            ]);
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
                'type' => 'incident_deleted',
            ])
            ->custom([
                'android' => [
                    'priority' => 'normal',
                    'notification' => [
                        'channel_id' => 'incidents',
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
                            'category' => 'incident_deleted',
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
        $actionUrl = $notifiable->hasRole('admin') ? '/admin/incidents' : '/resident/incidents';

        $text = "🗑 <b>Incident Report Deleted</b>\n\n"
            ."📌 Incident: <b>{$this->incidentTitle}</b>\n"
            ."👤 Deleted By: <b>{$this->deleterName}</b>\n"
            ."📍 Estate: <b>{$this->estateName}</b>";

        return [
            'text' => $text,
            'keyboard' => [
                [
                    ['text' => '🔍 View Incidents Feed', 'url' => config('app.url').$actionUrl],
                ],
            ],
        ];
    }
}
