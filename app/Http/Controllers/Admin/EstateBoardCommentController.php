<?php

namespace App\Http\Controllers\Admin;

use App\Actions\EstateBoard\AddCommentAction;
use App\Actions\EstateBoard\DeleteCommentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\EstateBoard\StoreCommentRequest;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Services\Admin\EstateBoardService;
use App\Services\Admin\UserService;
use Illuminate\Http\RedirectResponse;

class EstateBoardCommentController extends Controller
{
    public function __construct(
        protected EstateBoardService $boardService,
        protected UserService $userService
    ) {}

    /**
     * Store a new comment on a post.
     */
    public function store(StoreCommentRequest $request, EstateBoardPost $post, AddCommentAction $action): RedirectResponse
    {
        $this->authorize('create', [EstateBoardComment::class, $post]);

        $estate = $this->userService->getCurrentEstate();
        $action->execute($request->validated(), $post, $estate);

        return back()->with('success', 'Comment added.');
    }

    /**
     * Delete a comment.
     */
    public function destroy(EstateBoardComment $comment, DeleteCommentAction $action): RedirectResponse
    {
        $this->authorize('delete', $comment);

        $action->execute($comment);

        return back()->with('success', 'Comment deleted.');
    }
}
