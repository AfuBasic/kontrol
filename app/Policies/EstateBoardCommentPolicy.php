<?php

namespace App\Policies;

use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EstateBoardCommentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can create a comment.
     */
    public function create(User $user, EstateBoardPost $post): bool
    {
        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $post->estate_id)
            ->exists();
    }

    /**
     * Determine if the user can delete a comment.
     */
    public function delete(User $user, EstateBoardComment $comment): bool
    {
        setPermissionsTeamId($comment->estate_id);

        return $comment->user_id === $user->id
            || $user->hasRole('admin')
            || $user->hasPermissionTo('board.moderate');
    }
}
