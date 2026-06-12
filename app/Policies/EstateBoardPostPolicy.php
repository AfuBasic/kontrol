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
        $hasEstateAccess = $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $post->estate_id)
            ->exists();

        if (! $hasEstateAccess) {
            return false;
        }

        if ($post->property_owner_id === null) {
            return true;
        }

        setPermissionsTeamId($post->estate_id);
        if ($user->hasRole('admin') || $post->property_owner_id === $user->id) {
            return true;
        }

        $profile = $user->profile;
        if (! $profile || $profile->property_owner_id !== $post->property_owner_id) {
            return false;
        }

        if ($post->applies_to === 'all') {
            return true;
        }

        return $post->targets()
            ->where(function ($q) use ($user, $profile) {
                $q->where(fn ($sub) => $sub->where('target_type', 'user')->where('target_id', $user->id))
                    ->when($profile->property_id, fn ($sub) => $sub->orWhere(fn ($sub2) => $sub2->where('target_type', 'property')->where('target_id', $profile->property_id)));
            })
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
        if ($post->comments()->exists()) {
            return false;
        }

        setPermissionsTeamId($post->estate_id);

        return $post->user_id === $user->id
            || $user->hasRole('admin')
            || $user->hasPermissionTo('estate-board.delete');
    }
}
