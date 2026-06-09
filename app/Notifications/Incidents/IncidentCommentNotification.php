<?php

namespace App\Notifications\Incidents;

use App\Channels\TelegramChannel;
use App\Models\Incident;
use App\Models\IncidentComment;
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

class IncidentCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Incident $incident,
        public IncidentComment $comment
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
        $commenterName = $this->comment->author?->name ?? 'A user';
        $actionUrl = $notifiable->hasRole('admin')
            ? '/admin/incidents/'.$this->incident->hashid
            : '/resident/incidents/'.$this->incident->hashid;

        return [
            'title' => 'New Comment on Incident',
            'message' => "{$commenterName} commented on '{$this->incident->title}'.",
            'incident_id' => $this->incident->id,
            'incident_hashid' => $this->incident->hashid,
            'comment_id' => $this->comment->id,
            'commenter_name' => $commenterName,
            'type' => 'incident_comment_created',
            'action_url' => $actionUrl,
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
            ->tag('incident-comment-'.$this->comment->id)
            ->data([
                'url' => $data['action_url'],
                'incident_id' => $this->incident->id,
                'incident_hashid' => $this->incident->hashid,
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
                'incident_hashid' => (string) $this->incident->hashid,
                'action_url' => (string) $data['action_url'],
                'type' => 'incident_comment_created',
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
                            'category' => 'incident_comment_created',
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
        $commenterName = $this->comment->author?->name ?? 'A user';
        $actionUrl = $notifiable->hasRole('admin')
            ? '/admin/incidents/'.$this->incident->hashid
            : '/resident/incidents/'.$this->incident->hashid;

        $text = "💬 <b>New Comment on Incident</b>\n\n"
            ."📌 Incident: <b>{$this->incident->title}</b>\n"
            ."👤 By: <b>{$commenterName}</b>\n"
            .'💬 Comment: <i>"'.e(Str::limit($this->comment->body, 100))."\"</i>\n"
            ."📍 Estate: <b>{$this->incident->estate->name}</b>";

        return [
            'text' => $text,
            'keyboard' => [
                [
                    ['text' => '🔍 View Incident', 'url' => config('app.url').$actionUrl],
                ],
            ],
        ];
    }
}
