<?php

namespace App\Services\Visitor;

use App\Models\AccessCode;
use App\Models\OrganizationBulkInviteRecipient;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\File;
use PdfStudio\Laravel\Facades\Pdf;

class BulkInvitePdfService
{
    /**
     * Generate a branded visitor pass PDF with embedded QR code.
     *
     * @return string Absolute file path to the generated temporary PDF
     */
    public function generatePassPdf(OrganizationBulkInviteRecipient $recipient, AccessCode $accessCode): string
    {
        $bulkInvite = $recipient->bulkInvite;
        $organization = $bulkInvite->organization;
        $estate = $bulkInvite->estate;

        $passUrl = route('public.pass', ['uuid' => $accessCode->pass_uuid]);
        $qrBase64 = $this->generateQrBase64($passUrl);

        $tempDir = storage_path('app/temp/bulk-passes');
        if (! File::isDirectory($tempDir)) {
            File::makeDirectory($tempDir, 0755, true, true);
        }

        $filePath = "{$tempDir}/pass-{$accessCode->code}-{$recipient->id}.pdf";

        Pdf::view('pdf.visitor.bulk-invite-pass')
            ->data([
                'recipient' => $recipient,
                'accessCode' => $accessCode,
                'bulkInvite' => $bulkInvite,
                'organizationName' => $organization?->name ?? 'Organization',
                'estateName' => $estate?->name ?? 'Estate',
                'role' => $bulkInvite->role,
                'purpose' => $bulkInvite->purpose,
                'validFrom' => $bulkInvite->valid_from?->format('M d, Y') ?? 'N/A',
                'validUntil' => $bulkInvite->valid_until?->format('M d, Y') ?? 'N/A',
                'passUrl' => $passUrl,
                'qrBase64' => $qrBase64,
            ])
            ->save($filePath);

        return $filePath;
    }

    /**
     * Generate a PNG data-URI base64 string for the given URL.
     */
    public function generateQrBase64(string $url): string
    {
        $qrCode = new QrCode($url);
        $writer = new PngWriter;

        $result = $writer->write($qrCode);

        return $result->getDataUri();
    }
}
