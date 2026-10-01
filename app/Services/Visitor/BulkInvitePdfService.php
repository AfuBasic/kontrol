<?php

namespace App\Services\Visitor;

use App\Models\AccessCode;
use App\Models\OrganizationBulkInviteRecipient;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\Result\ResultInterface;
use Illuminate\Support\Facades\Storage;
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
        // The QR is scanned at the gate, so it must carry the scanner payload, not the web link.
        $qrBase64 = $this->generateQrBase64($accessCode->gateQrPayload());

        $relativeDir = 'temp/bulk-passes';
        $fileName = "pass-{$accessCode->code}-{$recipient->id}.pdf";
        $relativePath = "{$relativeDir}/{$fileName}";

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
            ->save($relativePath);

        return Storage::disk('local')->path($relativePath);
    }

    /**
     * Generate a PNG data-URI base64 string for the given URL.
     */
    public function generateQrBase64(string $url): string
    {
        return $this->writeQr($url)->getDataUri();
    }

    /**
     * Raw PNG bytes for a QR code, for serving as an image response.
     */
    public function generateQrPng(string $data): string
    {
        return $this->writeQr($data)->getString();
    }

    /**
     * Kontrol-blue QR with high error correction, matching the in-app visitor pass so the
     * centred logo overlay can't make it unreadable at the gate.
     */
    private function writeQr(string $data): ResultInterface
    {
        return (new PngWriter)->write(new QrCode(
            data: $data,
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size: 360,
            margin: 8,
            foregroundColor: new Color(26, 93, 191),
        ));
    }
}
