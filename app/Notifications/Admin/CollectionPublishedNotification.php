<?php

namespace App\Notifications\Admin;

use App\Models\Collection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class CollectionPublishedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Collection $collection,
        public int $targetCount
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $via = ['mail', 'database', 'broadcast'];

        if ($notifiable->pushSubscriptions()->exists()) {
            $via[] = WebPushChannel::class;
        }

        if ($notifiable->fcm_token) {
            $via[] = FcmChannel::class;
        }

        return $via;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = route('admin.collections.show', $this->collection->ulid);

        return (new MailMessage)
            ->subject("Collection Published: {$this->collection->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your collection '{$this->collection->title}' has finished processing and is now active.")
            ->line("It has been successfully distributed to {$this->targetCount} resident(s).")
            ->action('View Collection', $url)
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'collection_published',
            'estate_id' => $this->collection->estate_id,
            'target_role' => 'admin',
            'collection_id' => $this->collection->id,
            'collection_ulid' => $this->collection->ulid,
            'title' => $this->collection->title,
            'target_count' => $this->targetCount,
            'message' => "Collection '{$this->collection->title}' has been successfully published to {$this->targetCount} resident(s).",
            'action_url' => route('admin.collections.show', $this->collection->ulid, false),
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
                'action_url' => (string) $data['action_url'],
                'collection_id' => (string) $this->collection->id,
                'type' => 'collection_published',
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
                            'category' => 'collection_published',
                        ],
                    ],
                ],
            ]);
    }
}
