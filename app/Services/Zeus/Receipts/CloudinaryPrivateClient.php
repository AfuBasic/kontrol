<?php

namespace App\Services\Zeus\Receipts;

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Receipts and ID photos are sensitive documents, so they are stored as Cloudinary "authenticated" assets: nobody can open one
 * without a signed, short-lived link, and the only place that link is made is here, on the server.
 */
class CloudinaryPrivateClient implements PrivateCloudClient
{
    public function upload(string $localPath, string $publicId, string $resourceType): string
    {
        $response = Cloudinary::uploadApi()->upload($localPath, [
            'public_id' => $publicId,
            'resource_type' => $resourceType,
            'type' => 'authenticated',
            'overwrite' => false,
            'unique_filename' => false,
            'use_filename' => false,
        ]);

        return (string) $response['public_id'];
    }

    /**
     * Cloudinary refuses the signed CDN link for authenticated assets on this account, so the file is read through
     * its signed download endpoint instead: a link that is made here, expires in five minutes, and is used straight away.
     */
    public function fetch(string $publicId, string $resourceType, string $format): string
    {
        $url = Cloudinary::uploadApi()->privateDownloadUrl($publicId, $format, [
            'type' => 'authenticated',
            'resource_type' => $resourceType,
            'expires_at' => time() + 300,
        ]);

        $response = Http::timeout(30)->get($url);

        if (! $response->successful()) {
            throw new RuntimeException("Cloudinary returned {$response->status()} for a receipt.");
        }

        return $response->body();
    }
}
