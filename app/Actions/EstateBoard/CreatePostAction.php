<?php

namespace App\Actions\EstateBoard;

use App\Enums\EstateBoardPostStatus;
use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\EstateBoardPostMedia;
use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CreatePostAction
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    /**
     * @param  array{title?: string|null, body: string, status: string, images?: array<UploadedFile>}  $data
     */
    public function execute(array $data, Estate $estate): EstateBoardPost
    {
        return DB::transaction(function () use ($data, $estate) {
            $user = Auth::user();
            $status = EstateBoardPostStatus::from($data['status']);

            $post = EstateBoardPost::create([
                'estate_id' => $estate->id,
                'user_id' => $user->id,
                'title' => $data['title'] ?? null,
                'body' => $data['body'],
                'status' => $status,
                'published_at' => $status === EstateBoardPostStatus::Published ? now() : null,
            ]);

            if (! empty($data['images'])) {
                $this->attachMedia($post, $data['images'], $estate);
            }

            activity()
                ->performedOn($post)
                ->causedBy($user)
                ->withProperties(['estate_id' => $estate->id])
                ->log('created board post: '.($post->title ?: 'Untitled'));

            return $post->load(['author', 'media']);
        });
    }

    /**
     * @param  array<UploadedFile>  $images
     */
    protected function attachMedia(EstateBoardPost $post, array $images, Estate $estate): void
    {
        foreach ($images as $index => $image) {
            $uploadResult = $this->cloudinaryService->uploadImage($image, $estate);

            EstateBoardPostMedia::create([
                'estate_board_post_id' => $post->id,
                'estate_id' => $estate->id,
                'disk' => 'cloudinary',
                'path' => $uploadResult['path'],
                'url' => $uploadResult['url'],
                'mime_type' => $image->getMimeType(),
                'size_bytes' => $uploadResult['size_bytes'],
                'width' => $uploadResult['width'],
                'height' => $uploadResult['height'],
                'hash' => $uploadResult['hash'],
                'sort_order' => $index,
            ]);
        }
    }
}
