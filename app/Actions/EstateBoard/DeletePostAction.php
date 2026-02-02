<?php

namespace App\Actions\EstateBoard;

use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeletePostAction
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    public function execute(EstateBoardPost $post, Estate $estate): void
    {
        DB::transaction(function () use ($post, $estate) {
            $user = Auth::user();

            foreach ($post->media as $media) {
                $this->cloudinaryService->deleteImage($media->path);
            }

            $postTitle = $post->title ?: 'Untitled';
            $post->delete();

            activity()
                ->causedBy($user)
                ->withProperties(['estate_id' => $estate->id, 'post_title' => $postTitle])
                ->log('deleted board post: '.$postTitle);
        });
    }
}
