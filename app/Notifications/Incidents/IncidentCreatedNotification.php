<?php

namespace App\Notifications\Incidents;

use App\Channels\TelegramChannel;
use App\Models\Incident;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class IncidentCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Incident $incident
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
        $reporterName = $this->incident->reporter?->name ?? 'A resident';

        return [
            'title' => 'New Incident Reported',
            'message' => "'{$this->incident->title}' reported by {$reporterName}.",
            'incident_id' => $this->incident->id,
            'incident_hashid' => $this->incident->hashid,
            'reporter_name' => $reporterName,
            'type' => 'incident_created',
            'action_url' => '/admin/incidents/'.$this->incident->hashid,
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
            ->tag('incident-created-'.$this->incident->id)
            ->data([
                'url' => $data['action_url'],
                'incident_id' => $this->incident->id,
                'incident_hashid' => $this->incident->hashid,
            ])
            ->options([
                'TTL' => 3600,
                'urgency' => 'high',
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
                'incident_hashid' => (string) $this->incident->hashid,
                'action_url' => (string) $data['action_url'],
                'type' => 'incident_created',
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
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
                            'category' => 'incident_created',
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
        $reporterName = $this->incident->reporter?->name ?? 'A resident';
        $text = "🚨 <b>New Incident Reported</b>\n\n"
            ."📌 Title: <b>{$this->incident->title}</b>\n"
            ."📁 Category: <b>{$this->incident->category->label()}</b>\n"
            ."👤 Reporter: <b>{$reporterName}</b>\n"
            ."📍 Estate: <b>{$this->incident->estate->name}</b>";

        return [
            'text' => $text,
            'keyboard' => [
                [
                    ['text' => '🔍 View Incident', 'url' => config('app.url').'/admin/incidents/'.$this->incident->hashid],
                ],
            ],
        ];
    }
}
