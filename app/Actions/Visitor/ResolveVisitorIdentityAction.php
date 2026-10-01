<?php

namespace App\Actions\Visitor;

use App\Models\VisitorProfile;
use App\Services\Visitor\VisitorProfileResolverService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ResolveVisitorIdentityAction
{
    public function __construct(private VisitorProfileResolverService $resolver) {}

    /**
     * Resolve or create a visitor profile from an uploaded ID photo.
     *
     *
     * @throws ValidationException
     */
    public function execute(?string $visitorName, ?UploadedFile $idPhotoFile, int $estateId): VisitorProfile
    {
        if (! $idPhotoFile) {
            throw ValidationException::withMessages([
                'id_photo' => ['An ID photo is required for visitor identification.'],
            ]);
        }

        $hash = hash_file('sha256', $idPhotoFile->getRealPath());
        $storedPath = 'quick-entry-ids/'.$hash.'.jpg';

        Storage::disk('local')->put($storedPath, $idPhotoFile->getContent());

        $absolutePath = Storage::disk('local')->path($storedPath);

        return $this->resolver->resolve($estateId, $visitorName, $absolutePath);
    }
}
