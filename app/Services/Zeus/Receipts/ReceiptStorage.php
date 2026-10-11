<?php

namespace App\Services\Zeus\Receipts;

use App\Models\ExpenseReceipt;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Saves and serves expense receipts on the app's default disk. When that is Cloudinary they go up as private
 * assets and are fetched through a signed link; any other disk uses Laravel's Storage. Every receipt remembers its
 * own disk, so changing the default later never strands older receipts.
 */
class ReceiptStorage
{
    public const CLOUDINARY = 'cloudinary';

    public function __construct(private PrivateCloudClient $cloud) {}

    /**
     * @return array{disk: string, path: string, resource_type: string|null}
     */
    public function store(UploadedFile $file): array
    {
        $disk = (string) config('filesystems.default');
        $folder = 'expenses/receipts/'.now()->format('Y/m');
        $name = Str::uuid()->toString();

        if ($disk === self::CLOUDINARY) {
            // PDFs go up as raw files (Cloudinary treats images specially and can block PDF delivery).
            $isPdf = $file->getMimeType() === 'application/pdf';
            $publicId = 'kontrol/'.$folder.'/'.$name.($isPdf ? '.pdf' : '');
            $resourceType = $isPdf ? 'raw' : 'image';

            return [
                'disk' => self::CLOUDINARY,
                'path' => $this->cloud->upload($file->getRealPath(), $publicId, $resourceType),
                'resource_type' => $resourceType,
            ];
        }

        $extension = $file->guessExtension() ?: 'bin';

        return [
            'disk' => $disk,
            'path' => Storage::disk($disk)->putFileAs($folder, $file, $name.'.'.$extension),
            'resource_type' => null,
        ];
    }

    /**
     * The receipt as an HTTP response, shown in the browser or saved, depending on $download.
     */
    public function respond(ExpenseReceipt $receipt, bool $download): Response
    {
        $headers = [
            'Content-Type' => $receipt->mime,
            'Content-Disposition' => ($download ? 'attachment' : 'inline').'; filename="'.addcslashes($receipt->original_name, '"\\').'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, max-age=300',
        ];

        if ($receipt->disk === self::CLOUDINARY) {
            try {
                $bytes = $this->cloud->fetch($receipt->path, $receipt->resource_type ?? 'image', $this->formatFor($receipt->mime));
            } catch (RuntimeException) {
                abort(502, 'The receipt could not be fetched right now. Try again in a moment.');
            }

            return response($bytes, 200, $headers);
        }

        $disk = Storage::disk($receipt->disk);
        abort_unless($disk->exists($receipt->path), 404);

        return $disk->response($receipt->path, $receipt->original_name, $headers);
    }

    /**
     * The file extension Cloudinary needs to deliver a stored receipt.
     */
    private function formatFor(string $mime): string
    {
        return match ($mime) {
            'application/pdf' => 'pdf',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'jpg',
        };
    }
}
