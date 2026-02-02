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

class UpdatePostAction
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    /**
     * @param  array{title?: string|null, body: string, status: string, images?: array<UploadedFile>, remove_media_ids?: array<int>}  $data
     */
    public function execute(EstateBoardPost $post, array $data, Estate $estate): EstateBoardPost
    {
        return DB::transaction(function () use ($post, $data, $estate) {
            $user = Auth::user();
            $status = EstateBoardPostStatus::from($data['status']);
            $wasPublished = $post->status === EstateBoardPostStatus::Published;

            $post->update([
                'title' => $data['title'] ?? null,
                'body' => $data['body'],
                'status' => $status,
                'published_at' => $status === EstateBoardPostStatus::Published && ! $wasPublished
                    ? now()
                    : $post->published_at,
            ]);

            if (! empty($data['remove_media_ids'])) {
                $this->removeMedia($post, $data['remove_media_ids']);
            }

            if (! empty($data['images'])) {
                $maxOrder = $post->media()->max('sort_order') ?? -1;

                foreach ($data['images'] as $index => $image) {
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
                        'sort_order' => $maxOrder + $index + 1,
                    ]);
                }
            }

            activity()
                ->performedOn($post)
                ->causedBy($user)
                ->withProperties(['estate_id' => $estate->id])
                ->log('updated board post: '.($post->title ?: 'Untitled'));

            return $post->fresh(['author', 'media']);
        });
    }

    /**
     * @param  array<int>  $mediaIds
     */
    protected function removeMedia(EstateBoardPost $post, array $mediaIds): void
    {
        $mediaToDelete = $post->media()->whereIn('id', $mediaIds)->get();

        foreach ($mediaToDelete as $media) {
            $this->cloudinaryService->deleteImage($media->path);
            $media->delete();
        }
    }
}
