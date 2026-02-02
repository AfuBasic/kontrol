<?php

namespace App\Actions\EstateBoard;

use App\Models\EstateBoardComment;
use Illuminate\Support\Facades\Auth;

class DeleteCommentAction
{
    public function execute(EstateBoardComment $comment): void
    {
        $user = Auth::user();

        activity()
            ->performedOn($comment->post)
            ->causedBy($user)
            ->withProperties(['comment_id' => $comment->id])
            ->log('deleted comment');

        $comment->delete();
    }
}
