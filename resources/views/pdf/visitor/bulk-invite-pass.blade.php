<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>Visitor Pass - {{ $accessCode->code }}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'DejaVu Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            color: #0f172a;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.4;
            padding: 40px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
        }

        .header-table {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
        }

        .header-table td {
            vertical-align: middle;
        }

        .logo-img {
            height: 28px;
            width: auto;
            display: block;
            margin-bottom: 4px;
        }

        .doc-descriptor {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            letter-spacing: 0.02em;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            background-color: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
        }

        /* Pass Container Card */
        .pass-card {
            border: 2px solid #0f172a;
            border-radius: 12px;
            background-color: #ffffff;
            margin-bottom: 24px;
            overflow: hidden;
        }

        .pass-header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 16px 20px;
        }

        .pass-header-title {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }

        .pass-header-sub {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
        }

        .pass-body {
            padding: 24px 20px;
        }

        .qr-box {
            text-align: center;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            width: 170px;
            margin: 0 auto;
        }

        .qr-img {
            width: 140px;
            height: 140px;
            display: block;
            margin: 0 auto;
        }

        .qr-caption {
            margin-top: 8px;
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .code-display {
            background-color: #f1f5f9;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
            margin-top: 16px;
        }

        .code-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
        }

        .code-val {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 4px;
            color: #0f172a;
        }

        /* Details Table */
        .details-table {
            margin-bottom: 12px;
        }

        .details-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }

        .detail-label {
            width: 35%;
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .detail-val {
            width: 65%;
            font-size: 12px;
            color: #0f172a;
            font-weight: 700;
        }

        /* Notice Box */
        .instructions-box {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 24px;
        }

        .instructions-title {
            font-size: 11px;
            font-weight: 700;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }

        .instructions-text {
            font-size: 11px;
            color: #0c4a6e;
            line-height: 1.45;
        }

        /* Footer */
        .footer-divider {
            height: 1px;
            background-color: #e2e8f0;
            margin-bottom: 12px;
        }

        .footer-table {
            font-size: 10px;
            color: #64748b;
        }

        .footer-table td {
            vertical-align: top;
        }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('assets/images/kontrol-logo-horizontal.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;
    @endphp

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" alt="Kontrol" class="logo-img">
                @else
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">KONTROL</div>
                @endif
                <div class="doc-descriptor">Official Visitor Entry Pass</div>
            </td>
            <td style="width: 40%; text-align: right;">
                <span class="status-badge">Valid Pass</span>
            </td>
        </tr>
    </table>

    <!-- Main Card -->
    <div class="pass-card">
        <div class="pass-header">
            <div class="pass-header-title">{{ $organizationName }}</div>
            <div class="pass-header-sub">Authorized Visitor at {{ $estateName }}</div>
        </div>

        <div class="pass-body">
            <table>
                <tr>
                    <!-- Left: Details -->
                    <td style="width: 58%; vertical-align: top; padding-right: 20px;">
                        <table class="details-table">
                            <tr>
                                <td class="detail-label">Recipient:</td>
                                <td class="detail-val">{{ $recipient->email }}</td>
                            </tr>
                            @if(!empty($role))
                            <tr>
                                <td class="detail-label">Role:</td>
                                <td class="detail-val">{{ $role }}</td>
                            </tr>
                            @endif
                            @if(!empty($purpose))
                            <tr>
                                <td class="detail-label">Purpose:</td>
                                <td class="detail-val">{{ $purpose }}</td>
                            </tr>
                            @endif
                            <tr>
                                <td class="detail-label">Valid From:</td>
                                <td class="detail-val">{{ $validFrom }}</td>
                            </tr>
                            <tr>
                                <td class="detail-label">Valid Until:</td>
                                <td class="detail-val">{{ $validUntil }}</td>
                            </tr>
                            <tr>
                                <td class="detail-label">Issued By:</td>
                                <td class="detail-val">{{ $organizationName }}</td>
                            </tr>
                        </table>

                        <div class="code-display">
                            <div class="code-label">Access Passcode</div>
                            <div class="code-val">{{ $accessCode->code }}</div>
                        </div>
                    </td>

                    <!-- Right: QR Code -->
                    <td style="width: 42%; vertical-align: top; text-align: center;">
                        <div class="qr-box">
                            <img src="{{ $qrBase64 }}" alt="Pass QR Code" class="qr-img">
                            <div class="qr-caption">Scan at Security Gate</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Security Instructions -->
    <div class="instructions-box">
        <div class="instructions-title">Entry Verification Guidelines</div>
        <div class="instructions-text">
            Please present this document (printed or on your mobile device) upon arriving at the security entrance gate. The security guard will scan the QR code or verify your 6-character access passcode against the registry.
        </div>
    </div>

    <!-- Footer -->
    <div class="footer-divider"></div>
    <table class="footer-table">
        <tr>
            <td style="width: 60%;">
                Pass Reference: <strong>{{ $accessCode->pass_uuid }}</strong><br>
                Issued for {{ $estateName }} via Kontrol Access Management.
            </td>
            <td style="width: 40%; text-align: right;">
                Generated on {{ now()->format('M d, Y H:i') }}<br>
                © {{ date('Y') }} Kontrol. All rights reserved.
            </td>
        </tr>
    </table>
</body>
</html>
