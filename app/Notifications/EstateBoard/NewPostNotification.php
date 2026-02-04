<?php

namespace App\Notifications\EstateBoard;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use App\Models\EstateBoardPost;

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
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New Announcement',
            'message' => $this->post->title ?? 'New post from ' . $this->post->estate->name,
            'post_id' => $this->post->id,
            'author_name' => $this->post->author->name ?? 'Admin',
            'type' => 'new_post',
        ];
    }
}
