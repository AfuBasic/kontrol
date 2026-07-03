<?php

namespace App\Actions\EstateBoard;

use App\Enums\EstateBoardPostStatus;
use App\Models\EstateBoardPost;
use App\Models\EstateBoardPostRead;
use App\Models\User;

class RecordPostReadAction
{
    /**
     * Record that an audience member has opened a published post.
     * Each user is counted at most once per post.
     */
    public function execute(EstateBoardPost $post, User $user): bool
    {
        if ($post->status !== EstateBoardPostStatus::Published || $post->published_at === null) {
            return false;
        }

        $read = EstateBoardPostRead::firstOrCreate([
            'estate_board_post_id' => $post->id,
            'user_id' => $user->id,
        ]);

        return $read->wasRecentlyCreated;
    }
}
