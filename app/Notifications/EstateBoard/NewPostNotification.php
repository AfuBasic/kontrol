<?php

namespace App\Notifications\EstateBoard;

use App\Models\EstateBoardPost;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewPostNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public EstateBoardPost $post
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Add WebPush channel if user has push subscriptions
        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
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
        return [
            'title' => 'New Announcement',
            'message' => $this->post->title ?? 'New post from '.$this->post->estate->name,
            'post_id' => $this->post->id,
            'post_hashid' => $this->post->hashid,
            'author_name' => $this->post->author->name ?? 'Admin',
            'type' => 'new_post',
        ];
    }

    /**
     * Get the web push notification representation.
     */
    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $title = $this->post->title ?: 'New Announcement';
        $authorName = $this->post->author?->name ?? 'Admin';

        return (new WebPushMessage)
            ->title($title)
            ->body("Posted by {$authorName}")
            ->icon('/assets/images/app-icon.png')
            ->badge('/assets/images/app-icon.png')
            ->tag('new-post-'.$this->post->id)
            ->data([
                'url' => '/resident/feed/'.$this->post->hashid,
                'post_id' => $this->post->id,
                'post_hashid' => $this->post->hashid,
            ])
            ->options([
                'TTL' => 3600, // Time to live in seconds (1 hour)
                'urgency' => 'normal',
            ]);
    }
}
