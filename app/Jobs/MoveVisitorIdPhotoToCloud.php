<?php

namespace App\Jobs;

use App\Models\VisitorProfile;
use App\Services\Zeus\Receipts\PrivateCloudClient;
use App\Support\Queues;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * A new visitor's ID photo is saved on this server first, so admitting them at the gate stays fast and never waits
 * on the network. This job then moves it to Cloudinary as a private file and removes the local copy. If Cloudinary
 * is unreachable it retries, and the local file stays put until the move has really worked, so no photo is ever lost.
 */
class MoveVisitorIdPhotoToCloud implements ShouldQueue
{
    use Queueable;

    public const CLOUDINARY = 'cloudinary';

    /** Seconds before the worker gives up on one run. Must stay below the queue's retry_after. */
    public int $timeout = 120;

    public int $tries = 5;

    /**
     * @var array<int, int>
     */
    public array $backoff = [30, 120, 300, 900];

    public function __construct(public int $visitorProfileId)
    {
        $this->onQueue(Queues::HEAVY);
    }

    public function handle(PrivateCloudClient $cloud): void
    {
        $profile = VisitorProfile::query()->find($this->visitorProfileId);

        // Already moved, or nothing to move (for example a seeded profile with no photo).
        if (! $profile || $profile->id_photo_disk !== 'local' || ! $profile->id_photo_path || ! is_file($profile->id_photo_path)) {
            return;
        }

        $localPath = $profile->id_photo_path;
        $publicId = $cloud->upload($localPath, 'kontrol/quick-entry-ids/'.$profile->id_photo_hash, 'image');

        $profile->update(['id_photo_disk' => self::CLOUDINARY, 'id_photo_path' => $publicId]);

        // Only now that the record points at Cloudinary is the local copy safe to remove.
        @unlink($localPath);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Could not move a visitor ID photo to Cloudinary; the local copy is kept.', [
            'visitor_profile_id' => $this->visitorProfileId,
            'error' => $exception->getMessage(),
        ]);
    }
}
