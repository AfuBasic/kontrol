<?php

namespace App\Services\Visitor;

use App\Models\AccessCode;
use App\Models\OrganizationBulkInviteRecipient;
use App\Support\BrandTheme;
use App\Support\MaskedEmail;
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
        $relativeDir = 'temp/bulk-passes';
        $fileName = "pass-{$accessCode->code}-{$recipient->id}.pdf";
        $relativePath = "{$relativeDir}/{$fileName}";

        // DomPDF keeps converted fonts here; it has to be somewhere the app can write.
        $fontDir = storage_path('fonts');
        if (! is_dir($fontDir)) {
            @mkdir($fontDir, 0775, true);
        }

        Pdf::view('pdf.visitor.bulk-invite-pass')
            ->data($this->passViewData($recipient, $accessCode))
            ->save($relativePath);

        return Storage::disk('local')->path($relativePath);
    }

    /**
     * Everything the pass template shows, worked out in one place so it can be tested without rendering.
     *
     * The pass says what it is for and who vouches for it. The visitor's email is the only identity we
     * hold, so it is shown masked: enough for a guard to ask "which address did you receive this at?".
     * It makes no claim about whether the pass is still valid: that is decided at the gate, never by this
     * document.
     *
     * @return array<string, mixed>
     */
    public function passViewData(OrganizationBulkInviteRecipient $recipient, AccessCode $accessCode): array
    {
        $bulkInvite = $recipient->bulkInvite;
        $organizationName = $bulkInvite->organization?->name ?? 'Organization';
        $estateName = $bulkInvite->estate?->name ?? 'Estate';

        // The host is the person who issued the invite: the first thing a guard asks about.
        $host = $accessCode->user;

        // "Pass 14 of 120": position in the batch, stable even if people are later removed.
        $ids = $bulkInvite->recipients()->orderBy('id')->pluck('id');
        $position = $ids->search($recipient->id);
        $isBatch = $ids->count() > 1 && $position !== false;

        // Invites created without an "event or reason" were stored with a generated "<Org> - Visitor Pass".
        // That is not a reason, so it is treated as blank.
        $purpose = trim((string) $bulkInvite->purpose);
        $batchLabel = $purpose !== '' && $purpose !== "{$organizationName} - Visitor Pass" ? $purpose : null;

        $colors = [
            'header' => BrandTheme::color('primary-600'),
            'headerSoft' => BrandTheme::color('primary-100'),
            'accent' => BrandTheme::color('primary-700'),
            'tint' => BrandTheme::color('primary-50'),
            'tintBorder' => BrandTheme::color('primary-200'),
            'ink' => BrandTheme::color('gray-900'),
            'body' => BrandTheme::color('gray-700'),
            'muted' => BrandTheme::color('gray-500'),
            'hairline' => BrandTheme::color('gray-200'),
            'wash' => BrandTheme::color('gray-50'),
        ];

        return [
            'recipient' => $recipient,
            'accessCode' => $accessCode,
            'bulkInvite' => $bulkInvite,
            'organizationName' => $organizationName,
            'estateName' => $estateName,
            'hostName' => $host?->name,
            'hostUnit' => $host?->profile?->unit_number,
            'maskedEmail' => MaskedEmail::mask($recipient->email),
            'role' => $bulkInvite->role,
            'batchLabel' => $batchLabel,
            'entryMode' => $this->entryMode((string) $accessCode->type),
            'passNumber' => $isBatch ? $position + 1 : null,
            'passTotal' => $isBatch ? $ids->count() : null,
            'issuedOn' => ($accessCode->created_at ?? now())->format('M d, Y'),
            'validFrom' => $bulkInvite->valid_from?->format('M d, Y') ?? 'N/A',
            'validUntil' => $bulkInvite->valid_until?->format('M d, Y') ?? 'N/A',
            'passUrl' => route('public.pass', ['uuid' => $accessCode->pass_uuid]),
            // The QR is scanned at the gate, so it must carry the scanner payload, not the web link.
            'qrBase64' => $this->generateQrBase64($accessCode->gateQrPayload()),
            'colors' => $colors,
            'fonts' => $this->embeddedFonts(),
        ];
    }

    /**
     * Whether the pass opens the gate once or repeatedly, in words a visitor understands.
     *
     * @return array{label: string, hint: string}
     */
    public function entryMode(string $type): array
    {
        return $type === 'single_use'
            ? ['label' => 'Single entry', 'hint' => 'Works for one visit']
            : ['label' => 'Multiple entry', 'hint' => 'Works for repeat visits until it expires'];
    }

    /**
     * The app's typeface (Inter), as files DomPDF can embed. Returns nothing until the files are in
     * resources/fonts/inter, in which case the template falls back to DejaVu Sans and still renders.
     *
     * @return array<int, string> weight => absolute path
     */
    public function embeddedFonts(): array
    {
        $found = [];

        // DomPDF only distinguishes regular from bold (every weight from 600 up is bold), so two files do it.
        foreach ([400, 700] as $weight) {
            foreach (['woff', 'ttf', 'otf'] as $extension) {
                $path = resource_path("fonts/inter/inter-latin-{$weight}-normal.{$extension}");

                if (is_file($path)) {
                    $found[$weight] = $path;
                    break;
                }
            }
        }

        return $found;
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
