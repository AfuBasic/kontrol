<?php

namespace App\Services\Visitor;

use App\Models\VisitorProfile;

class VisitorProfileResolverService
{
    /**
     * Resolve or create a visitor profile from an ID photo.
     *
     * @param  string  $idPhotoPath  Absolute path to the stored ID photo file
     */
    public function resolve(int $estateId, ?string $visitorName, string $idPhotoPath): VisitorProfile
    {
        $hash = $this->computeHash($idPhotoPath);

        $profile = VisitorProfile::where('estate_id', $estateId)
            ->where('id_photo_hash', $hash)
            ->first();

        if ($profile) {
            $profile->update([
                'last_seen_at' => now(),
                'visit_count' => $profile->visit_count + 1,
            ]);

            return $profile->fresh();
        }

        return VisitorProfile::create([
            'estate_id' => $estateId,
            'name' => $visitorName ?: 'Unknown Visitor',
            'id_photo_hash' => $hash,
            'id_photo_path' => $idPhotoPath,
            'first_seen_at' => now(),
            'visit_count' => 1,
        ]);
    }

    /**
     * Compute a SHA-256 hash of the photo file for deduplication.
     */
    private function computeHash(string $filePath): string
    {
        return hash_file('sha256', $filePath);
    }
}
