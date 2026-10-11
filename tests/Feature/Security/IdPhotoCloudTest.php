<?php

use App\Actions\Visitor\ResolveVisitorIdentityAction;
use App\Jobs\MoveVisitorIdPhotoToCloud;
use App\Models\Estate;
use App\Models\VisitorProfile;
use App\Services\Zeus\Receipts\PrivateCloudClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Queue::fake();
    $this->estate = Estate::factory()->create();

    $this->idPhoto = fn (string $contents = 'id-photo-bytes-A') => UploadedFile::fake()->createWithContent('id.jpg', $contents);
    $this->admit = fn (?UploadedFile $photo = null, string $name = 'Zed') => app(ResolveVisitorIdentityAction::class)
        ->execute($name, $photo ?? ($this->idPhoto)(), $this->estate->id);
});

/** A stand-in for Cloudinary that records uploads, so no test touches the real account. */
function fakeIdCloud(bool $failing = false): object
{
    $fake = new class($failing) implements PrivateCloudClient
    {
        /** @var array<int, array{path: string, publicId: string, resourceType: string, bytes: string}> */
        public array $uploads = [];

        public function __construct(private bool $failing) {}

        public function upload(string $localPath, string $publicId, string $resourceType): string
        {
            if ($this->failing) {
                throw new RuntimeException('Cloudinary is down');
            }

            $this->uploads[] = ['path' => $localPath, 'publicId' => $publicId, 'resourceType' => $resourceType, 'bytes' => (string) file_get_contents($localPath)];

            return $publicId;
        }

        public function fetch(string $publicId, string $resourceType, string $format): string
        {
            return '';
        }
    };

    app()->instance(PrivateCloudClient::class, $fake);

    return $fake;
}

// ---------- The gate never waits on Cloudinary ----------

it('saves a first-time visitor locally and queues the move to Cloudinary when it is the default disk', function () {
    config(['filesystems.default' => 'cloudinary']);
    $cloud = fakeIdCloud();

    $profile = ($this->admit)();

    expect($profile->id_photo_disk)->toBe('local')
        ->and(is_file($profile->id_photo_path))->toBeTrue()
        ->and($cloud->uploads)->toBe([]);

    Queue::assertPushed(MoveVisitorIdPhotoToCloud::class, fn ($job) => $job->visitorProfileId === $profile->id);
    Queue::assertPushedTimes(MoveVisitorIdPhotoToCloud::class, 1);
});

it('does not queue another move for a returning visitor', function () {
    config(['filesystems.default' => 'cloudinary']);

    ($this->admit)();
    ($this->admit)(null, 'Zed again');

    Queue::assertPushedTimes(MoveVisitorIdPhotoToCloud::class, 1);
    expect(VisitorProfile::count())->toBe(1);
});

it('does not queue anything when the default disk is not Cloudinary', function () {
    ($this->admit)();

    Queue::assertNothingPushed();
});

// ---------- The move itself ----------

it('moves the photo to Cloudinary as a private image named by its hash, and removes the local copy', function () {
    $cloud = fakeIdCloud();
    $profile = ($this->admit)();
    $local = $profile->id_photo_path;

    (new MoveVisitorIdPhotoToCloud($profile->id))->handle($cloud);

    $profile->refresh();
    expect($cloud->uploads)->toHaveCount(1)
        ->and($cloud->uploads[0]['resourceType'])->toBe('image')
        ->and($cloud->uploads[0]['publicId'])->toBe('kontrol/quick-entry-ids/'.$profile->id_photo_hash)
        ->and($cloud->uploads[0]['bytes'])->toBe('id-photo-bytes-A')
        ->and($profile->id_photo_disk)->toBe('cloudinary')
        ->and($profile->id_photo_path)->toBe('kontrol/quick-entry-ids/'.$profile->id_photo_hash)
        ->and(file_exists($local))->toBeFalse();
});

it('keeps the local photo and the record untouched when Cloudinary fails, so the job can retry', function () {
    $profile = ($this->admit)();
    $local = $profile->id_photo_path;

    expect(fn () => (new MoveVisitorIdPhotoToCloud($profile->id))->handle(fakeIdCloud(failing: true)))->toThrow(RuntimeException::class);

    $profile->refresh();
    expect($profile->id_photo_disk)->toBe('local')
        ->and($profile->id_photo_path)->toBe($local)
        ->and(is_file($local))->toBeTrue();
});

it('does nothing when run twice, or for a profile with no photo', function () {
    $cloud = fakeIdCloud();
    $profile = ($this->admit)();

    $job = new MoveVisitorIdPhotoToCloud($profile->id);
    $job->handle($cloud);
    $job->handle($cloud);
    expect($cloud->uploads)->toHaveCount(1);

    $seeded = VisitorProfile::create([
        'estate_id' => $this->estate->id, 'name' => 'Seeded', 'id_photo_hash' => str_repeat('a', 64), 'id_photo_path' => null,
        'first_seen_at' => now(), 'visit_count' => 1,
    ]);
    (new MoveVisitorIdPhotoToCloud($seeded->id))->handle($cloud);
    (new MoveVisitorIdPhotoToCloud(999999))->handle($cloud);

    expect($cloud->uploads)->toHaveCount(1);
});

it('logs that the local copy is kept when every retry has failed', function () {
    Log::spy();
    $profile = ($this->admit)();

    (new MoveVisitorIdPhotoToCloud($profile->id))->failed(new RuntimeException('Cloudinary is down'));

    Log::shouldHaveReceived('error')->once()->withArgs(fn ($message, $context) => str_contains($message, 'local copy is kept') && $context['visitor_profile_id'] === $profile->id);
});

it('retries with growing waits and gives up after five tries', function () {
    $job = new MoveVisitorIdPhotoToCloud(1);

    expect($job->tries)->toBe(5)->and($job->backoff)->toBe([30, 120, 300, 900]);
});
