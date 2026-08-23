<?php

namespace App\Policies;

use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class EstateBoardCommentPolicy extends BaseContextPolicy
{
    /**
     * Determine if the user can create a comment.
     */
    public function create(User $user, EstateBoardPost $post): bool
    {
        return Gate::forUser($user)->allows('view', $post);
    }

    /**
     * Determine if the user can delete a comment.
     */
    public function delete(User $user, EstateBoardComment $comment): bool
    {
        if (! $this->hasValidContextForEstate($comment->estate_id)) {
            return false;
        }

        if (! Gate::forUser($user)->allows('view', $comment->post)) {
            return false;
        }

        return $comment->user_id === $user->id
            || $user->contextHasRole('admin')
            || $user->contextCan('board.moderate');
    }
}
