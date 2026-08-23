<?php

namespace App\Policies;

use App\Auth\ContextManager;
use App\Models\EstateBoardPost;
use App\Models\User;
use App\Models\Zone;

class EstateBoardPostPolicy extends BaseContextPolicy
{
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
        if (! $this->postIsVisibleInCurrentContext($post)) {
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

        if (! $this->postIsMutableInCurrentContext($post)) {
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

        if (! $this->postIsMutableInCurrentContext($post)) {
            return false;
        }

        return $post->user_id === $user->id
            || $user->contextHasRole('admin')
            || $user->contextCan('estate-board.delete');
    }

    private function postIsVisibleInCurrentContext(EstateBoardPost $post): bool
    {
        if (! $this->hasValidContextForEstate($post->estate_id)) {
            return false;
        }

        $context = app(ContextManager::class)->current();

        if (! $context?->isZoneScoped()) {
            return true;
        }

        if (($post->applies_to === null || $post->applies_to === 'all') && ! $post->targets()->exists()) {
            return true;
        }

        return $post->targets()
            ->whereIn('target_type', ['zone', Zone::class])
            ->where('target_id', $context->zoneId)
            ->exists();
    }

    private function postIsMutableInCurrentContext(EstateBoardPost $post): bool
    {
        $context = app(ContextManager::class)->current();

        if (! $context?->isZoneScoped()) {
            return true;
        }

        $targets = $post->targets()->get(['target_type', 'target_id']);

        return $targets->isNotEmpty()
            && $targets->every(fn ($target) => in_array($target->target_type, ['zone', Zone::class], true)
                && (int) $target->target_id === $context->zoneId);
    }
}
