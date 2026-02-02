<?php

namespace App\Services\Admin;

use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Support\Facades\Auth;

class EstateBoardService
{
    /**
     * Get the feed of published posts for an estate using cursor pagination.
     *
     * @return CursorPaginator<EstateBoardPost>
     */
    public function getFeed(int $estateId, int $perPage = 10): CursorPaginator
    {
        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->published()
            ->with([
                'author:id,name,email',
                'media' => fn ($q) => $q->limit(4)->orderBy('sort_order'),
            ])
            ->withCount('comments')
            ->orderByDesc('published_at')
            ->cursorPaginate($perPage);
    }

    /**
     * Get a single post with its details.
     */
    public function getPost(int $postId, int $estateId): ?EstateBoardPost
    {
        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->with([
                'author:id,name,email',
                'media',
            ])
            ->withCount('comments')
            ->find($postId);
    }

    /**
     * Get comments for a post using cursor pagination.
     *
     * @return CursorPaginator<EstateBoardComment>
     */
    public function getComments(int $postId, int $estateId, int $perPage = 15): CursorPaginator
    {
        return EstateBoardComment::query()
            ->where('estate_board_post_id', $postId)
            ->where('estate_id', $estateId)
            ->topLevel()
            ->with([
                'author:id,name,email',
                'replies' => fn ($q) => $q->with('author:id,name,email')->latest()->limit(3),
            ])
            ->withCount('replies')
            ->oldest()
            ->cursorPaginate($perPage);
    }

    /**
     * Get admin posts (including drafts) for management.
     *
     * @return CursorPaginator<EstateBoardPost>
     */
    public function getAdminPosts(int $estateId, int $perPage = 15): CursorPaginator
    {
        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->with(['author:id,name,email'])
            ->withCount(['comments', 'media'])
            ->orderByDesc('created_at')
            ->cursorPaginate($perPage);
    }

    /**
     * Get the current user's active estate.
     */
    public function getCurrentEstate(): Estate
    {
        $user = Auth::user();

        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->firstOrFail();
    }

    /**
     * Get the current estate ID.
     */
    public function getCurrentEstateId(): int
    {
        return $this->getCurrentEstate()->id;
    }
}
