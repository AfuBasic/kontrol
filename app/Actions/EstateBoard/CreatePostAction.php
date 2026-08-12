<?php

namespace App\Actions\EstateBoard;

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostCategory;
use App\Enums\EstateBoardPostPriority;
use App\Enums\EstateBoardPostStatus;
use App\Events\EstateBoard\NewPostBroadcast;
use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\EstateBoardPostMedia;
use App\Models\User;
use App\Notifications\EstateBoard\NewPostNotification;
use App\Services\CloudinaryService;
use App\Services\ZoneAudienceResolver;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CreatePostAction
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    /**
     * @param  array{title?: string|null, body: string, category: string, priority: string, status: string, audience: string, zone_ids?: array<int>, images?: array<UploadedFile>}  $data
     */
    public function execute(array $data, Estate $estate): EstateBoardPost
    {
        return DB::transaction(function () use ($data, $estate) {
            $user = Auth::user();
            $status = EstateBoardPostStatus::from($data['status']);
            $audience = EstateBoardPostAudience::from($data['audience']);
            $category = EstateBoardPostCategory::from($data['category']);
            $priority = EstateBoardPostPriority::from($data['priority']);

            $zoneIds = array_values(array_unique(array_filter($data['zone_ids'] ?? [])));

            $post = EstateBoardPost::create([
                'estate_id' => $estate->id,
                'user_id' => $user->id,
                'title' => $data['title'] ?? null,
                'body' => $data['body'],
                'category' => $category,
                'priority' => $priority,
                'status' => $status,
                'audience' => $audience,
                'applies_to' => $zoneIds === [] ? 'all' : 'custom',
                'published_at' => $status === EstateBoardPostStatus::Published ? now() : null,
            ]);

            foreach ($zoneIds as $zoneId) {
                $post->targets()->create([
                    'target_type' => 'zone',
                    'target_id' => $zoneId,
                ]);
            }

            if (! empty($data['images'])) {
                $this->attachMedia($post, $data['images'], $estate);
            }

            activity()
                ->performedOn($post)
                ->causedBy($user)
                ->withProperties(['estate_id' => $estate->id])
                ->log('created board post: '.($post->title ?: 'Untitled'));

            $post->load(['author', 'media']);

            // Send notification to relevant users if published
            if ($status === EstateBoardPostStatus::Published) {
                // Broadcast once to estate channel for real-time UI updates
                NewPostBroadcast::dispatch($post);

                // Store database notification for each user
                $query = User::forEstate($estate->id)->active();

                if ($audience === EstateBoardPostAudience::Residents) {
                    $query->role('resident');
                } elseif ($audience === EstateBoardPostAudience::Security) {
                    $query->role('security');
                }

                if ($zoneIds !== []) {
                    $zoneUserIds = app(ZoneAudienceResolver::class)->userIdsInZones($estate->id, $zoneIds);
                    $query->whereIn('id', $zoneUserIds);
                }

                $users = $query->where('id', '!=', $user->id)->get();

                Notification::send($users, new NewPostNotification($post));
            }

            return $post;
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
