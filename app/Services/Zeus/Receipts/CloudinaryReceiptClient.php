<?php

namespace App\Services\Zeus\Receipts;

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Receipts are financial documents, so they are stored as Cloudinary "authenticated" assets: nobody can open one
 * without a signed link, and the only place a signed link is made is here, on the server.
 */
class CloudinaryReceiptClient implements CloudReceiptClient
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

    public function fetch(string $publicId, string $resourceType): string
    {
        $asset = $resourceType === 'raw' ? Cloudinary::raw($publicId) : Cloudinary::image($publicId);
        $url = (string) $asset->deliveryType('authenticated')->signUrl(true)->toUrl();

        $response = Http::timeout(30)->get($url);

        if (! $response->successful()) {
            throw new RuntimeException("Cloudinary returned {$response->status()} for a receipt.");
        }

        return $response->body();
    }
}
