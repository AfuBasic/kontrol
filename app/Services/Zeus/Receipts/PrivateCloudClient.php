<?php

namespace App\Services\Zeus\Receipts;

interface PrivateCloudClient
{
    /**
     * Upload a file privately and return the public id it was stored under. Used for receipts and visitor ID photos.
     *
     * @param  'image'|'raw'  $resourceType
     */
    public function upload(string $localPath, string $publicId, string $resourceType): string;

    /**
     * The bytes of a private file.
     *
     * @param  'image'|'raw'  $resourceType
     * @param  string  $format  The file extension, for example "pdf" or "png"
     */
    public function fetch(string $publicId, string $resourceType, string $format): string;
}
