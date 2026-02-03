<?php

namespace App\Services;

use App\Models\Estate;
use App\Models\EstateBoardPostMedia;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    /**
     * Allowed MIME types for upload.
     *
     * @var array<string>
     */
    protected array $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    /**
     * Maximum file size in bytes (5MB).
     */
    protected int $maxFileSizeBytes = 5 * 1024 * 1024;

    /**
     * Upload an image to Cloudinary with deduplication.
     *
     * @return array{url: string, path: string, width: int|null, height: int|null, size_bytes: int, hash: string, is_duplicate: bool}
     *
     * @throws \InvalidArgumentException
     */
    public function uploadImage(UploadedFile $file, Estate $estate, string $folder = 'estate-board'): array
    {
        $this->validateFile($file);

        $hash = hash_file('sha256', $file->getRealPath());

        $existing = EstateBoardPostMedia::query()
            ->where('estate_id', $estate->id)
            ->where('hash', $hash)
            ->first();

        if ($existing) {
            return [
                'url' => $existing->url,
                'path' => $existing->path,
                'width' => $existing->width,
                'height' => $existing->height,
                'size_bytes' => $existing->size_bytes,
                'hash' => $hash,
                'is_duplicate' => true,
            ];
        }

        $uploadPath = "{$folder}/estate-{$estate->id}";

        try {
            $response = Cloudinary::uploadApi()->upload($file->getRealPath(), [
                'folder' => $uploadPath,
                'resource_type' => 'image',
            ]);

            return [
                'url' => $response['secure_url'],
                'path' => $response['public_id'],
                'width' => $response['width'] ?? null,
                'height' => $response['height'] ?? null,
                'size_bytes' => $response['bytes'] ?? $file->getSize(),
                'hash' => $hash,
                'is_duplicate' => false,
            ];
        } catch (\Exception $e) {
            Log::error('Cloudinary upload failed', [
                'estate_id' => $estate->id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to upload image: '.$e->getMessage());
        }
    }

    /**
     * Delete an image from Cloudinary.
     */
    public function deleteImage(string $publicId): bool
    {
        try {
            Cloudinary::uploadApi()->destroy($publicId);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete Cloudinary image', [
                'public_id' => $publicId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Generate a thumbnail URL.
     */
    public function getThumbnailUrl(string $publicId, int $width = 200, int $height = 200): string
    {
        $cloudName = config('filesystems.disks.cloudinary.cloud_name')
            ?? parse_url(config('filesystems.disks.cloudinary.url'), PHP_URL_HOST);

        return "https://res.cloudinary.com/{$cloudName}/image/upload/w_{$width},h_{$height},c_fill,q_auto/{$publicId}";
    }

    /**
     * Validate the uploaded file.
     *
     * @throws \InvalidArgumentException
     */
    protected function validateFile(UploadedFile $file): void
    {
        if (! in_array($file->getMimeType(), $this->allowedMimeTypes, true)) {
            throw new \InvalidArgumentException(
                'Invalid file type. Allowed types: '.implode(', ', $this->allowedMimeTypes)
            );
        }

        if ($file->getSize() > $this->maxFileSizeBytes) {
            throw new \InvalidArgumentException(
                'File size exceeds maximum allowed size of '.($this->maxFileSizeBytes / 1024 / 1024).'MB'
            );
        }
    }
}
