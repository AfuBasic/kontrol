<?php

namespace App\Policies;

use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use App\Auth\ContextManager;

class EstateBoardCommentPolicy
{
    use HandlesAuthorization;

    private function hasValidContextForEstate(int $estateId): bool
    {
        $context = app(ContextManager::class)->current();
        return $context !== null && $context->estateId === $estateId;
    }

    /**
     * Determine if the user can create a comment.
     */
    public function create(User $user, EstateBoardPost $post): bool
    {
        return $this->hasValidContextForEstate($post->estate_id);
    }

    /**
     * Determine if the user can delete a comment.
     */
    public function delete(User $user, EstateBoardComment $comment): bool
    {
        if (! $this->hasValidContextForEstate($comment->estate_id)) {
            return false;
        }

        return $comment->user_id === $user->id
            || $user->contextHasRole('admin')
            || $user->contextCan('board.moderate');
    }
}
