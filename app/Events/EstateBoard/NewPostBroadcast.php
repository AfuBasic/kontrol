<?php

namespace App\Events\EstateBoard;

use App\Enums\EstateBoardPostAudience;
use App\Models\EstateBoardPost;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewPostBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public EstateBoardPost $post
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $estateId = $this->post->estate_id;

        return match ($this->post->audience) {
            EstateBoardPostAudience::All => [
                new PrivateChannel("estates.{$estateId}.residents"),
                new PrivateChannel("estates.{$estateId}.security"),
            ],
            EstateBoardPostAudience::Residents => [
                new PrivateChannel("estates.{$estateId}.residents"),
            ],
            EstateBoardPostAudience::Security => [
                new PrivateChannel("estates.{$estateId}.security"),
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'post' => [
                'id' => $this->post->id,
                'hashid' => $this->post->hashid,
                'title' => $this->post->title,
                'body' => $this->post->body,
                'author' => $this->post->author?->name,
                'published_at' => $this->post->published_at?->toIso8601String(),
            ],
            'message' => 'New post: '.($this->post->title ?: 'Untitled'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'post.created';
    }
}
