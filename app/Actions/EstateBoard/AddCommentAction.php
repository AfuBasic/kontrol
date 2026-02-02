<?php

namespace App\Actions\EstateBoard;

use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddCommentAction
{
    /**
     * @param  array{body: string, parent_id?: int|null}  $data
     *
     * @throws ValidationException
     */
    public function execute(array $data, EstateBoardPost $post, Estate $estate): EstateBoardComment
    {
        return DB::transaction(function () use ($data, $post, $estate) {
            $user = Auth::user();

            $this->checkForDuplicate($user->id, $data['body']);

            $comment = EstateBoardComment::create([
                'estate_board_post_id' => $post->id,
                'estate_id' => $estate->id,
                'user_id' => $user->id,
                'body' => $data['body'],
                'parent_id' => $data['parent_id'] ?? null,
            ]);

            return $comment->load('author:id,name,email');
        });
    }

    /**
     * Check if the user has submitted an identical comment recently.
     *
     * @throws ValidationException
     */
    protected function checkForDuplicate(int $userId, string $body): void
    {
        $bodyHash = md5(trim($body));

        $exists = EstateBoardComment::query()
            ->where('user_id', $userId)
            ->where('created_at', '>=', now()->subSeconds(60))
            ->whereRaw('MD5(TRIM(body)) = ?', [$bodyHash])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'body' => 'You have already submitted this comment. Please wait before posting again.',
            ]);
        }
    }
}
