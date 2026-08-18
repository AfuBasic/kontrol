<?php

namespace App\Notifications\Admin;

use App\Models\Collection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

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
        return ['mail', 'database'];
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
            'collection_id' => $this->collection->id,
            'collection_ulid' => $this->collection->ulid,
            'title' => $this->collection->title,
            'target_count' => $this->targetCount,
            'message' => "Collection '{$this->collection->title}' has been successfully published to {$this->targetCount} resident(s).",
        ];
    }
}
