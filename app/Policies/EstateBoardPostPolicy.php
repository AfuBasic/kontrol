<?php

namespace App\Policies;

use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use App\Auth\ContextManager;

class EstateBoardPostPolicy
{
    use HandlesAuthorization;

    private function hasValidContextForEstate(int $estateId): bool
    {
        $context = app(ContextManager::class)->current();
        return $context !== null && $context->estateId === $estateId;
    }

    /**
     * Determine if the user can view posts (feed).
     */
    public function viewAny(User $user): bool
    {
        return app(ContextManager::class)->hasContext();
    }

    /**
     * Determine if the user can view a specific post.
     */
    public function view(User $user, EstateBoardPost $post): bool
    {
        if (! $this->hasValidContextForEstate($post->estate_id)) {
            return false;
        }

        if ($post->property_owner_id === null) {
            return true;
        }

        if ($user->contextHasRole('admin') || $post->property_owner_id === $user->id) {
            return true;
        }

        $propertyOwner = $user->getPropertyOwnerForEstate($post->estate_id);
        if (! $propertyOwner || $propertyOwner->id !== $post->property_owner_id) {
            return false;
        }

        if ($post->applies_to === 'all') {
            return true;
        }

        $profile = $user->profile;

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
        $context = app(ContextManager::class)->current();
        
        if (! $context) {
            return false;
        }

        return $user->contextHasRole('admin') || $user->contextCan('estate-board.create');
    }

    /**
     * Determine if the user can update a post.
     */
    public function update(User $user, EstateBoardPost $post): bool
    {
        if (! $this->hasValidContextForEstate($post->estate_id)) {
            return false;
        }

        return $post->user_id === $user->id
            || $user->contextHasRole('admin')
            || $user->contextCan('estate-board.edit');
    }

    /**
     * Determine if the user can delete a post.
     */
    public function delete(User $user, EstateBoardPost $post): bool
    {
        if ($post->comments()->exists()) {
            return false;
        }

        if (! $this->hasValidContextForEstate($post->estate_id)) {
            return false;
        }

        return $post->user_id === $user->id
            || $user->contextHasRole('admin')
            || $user->contextCan('estate-board.delete');
    }
}
