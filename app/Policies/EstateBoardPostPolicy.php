<?php

namespace App\Policies;

use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EstateBoardPostPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can view posts (feed).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine if the user can view a specific post.
     */
    public function view(User $user, EstateBoardPost $post): bool
    {
        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $post->estate_id)
            ->exists();
    }

    /**
     * Determine if the user can create posts.
     */
    public function create(User $user): bool
    {
        $estate = $user->estates()->wherePivot('status', 'accepted')->first();

        if (! $estate) {
            return false;
        }

        setPermissionsTeamId($estate->id);

        return $user->hasRole('admin') || $user->hasPermissionTo('estate-board.create');
    }

    /**
     * Determine if the user can update a post.
     */
    public function update(User $user, EstateBoardPost $post): bool
    {
        setPermissionsTeamId($post->estate_id);

        return $post->user_id === $user->id
            || $user->hasRole('admin')
            || $user->hasPermissionTo('estate-board.edit');
    }

    /**
     * Determine if the user can delete a post.
     */
    public function delete(User $user, EstateBoardPost $post): bool
    {
        setPermissionsTeamId($post->estate_id);

        return $post->user_id === $user->id
            || $user->hasRole('admin')
            || $user->hasPermissionTo('estate-board.delete');
    }
}
