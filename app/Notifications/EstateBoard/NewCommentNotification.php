<?php

namespace App\Notifications\EstateBoard;

use App\Channels\TelegramChannel;
use App\Models\EstateBoardComment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public EstateBoardComment $comment
    ) {}

    /**
     * Get the notification's delivery channels.
     *
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
     * Get the array representation of the notification for database storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $post = $this->comment->post;
        $commenterName = $this->comment->author->name;

        return [
            'title' => 'New Comment on Announcement',
            'message' => "{$commenterName} commented on \"{$post->title}\"",
            'post_id' => $post->id,
            'post_hashid' => $post->hashid,
            'comment_id' => $this->comment->id,
            'commenter_name' => $commenterName,
            'type' => 'new_comment',
            'action_url' => '/resident/estate-board/'.$post->hashid,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * Get the web push notification representation.
     */
    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $data = $this->toArray($notifiable);

        return (new WebPushMessage)
            ->title($data['title'])
            ->body($data['message'])
            ->icon('/assets/images/app-icon.png')
            ->badge('/assets/images/app-icon.png')
            ->tag('new-comment-'.$this->comment->id)
            ->data([
                'url' => $data['action_url'],
                'post_id' => $this->comment->post->id,
                'post_hashid' => $this->comment->post->hashid,
            ])
            ->options([
                'TTL' => 3600,
                'urgency' => 'normal',
            ]);
    }

    /**
     * Get the FCM notification representation.
     */
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
                'post_hashid' => (string) $this->comment->post->hashid,
                'action_url' => (string) $data['action_url'],
                'type' => 'new_comment',
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'board_posts',
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
                            'category' => 'new_comment',
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
        $post = $this->comment->post;
        $commenterName = $this->comment->author->name;
        $text = "💬 <b>New Comment on Announcement</b>\n\n"
            ."👤 Commenter: <b>{$commenterName}</b>\n"
            ."📣 Announcement: <b>{$post->title}</b>";

        return [
            'text' => $text,
            'keyboard' => [
                [
                    ['text' => '📖 Read More', 'url' => config('app.url').'/resident/estate-board/'.$post->hashid],
                ],
            ],
        ];
    }
}
