<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>Visitor Pass - {{ $accessCode->code }}</title>
    <style>
        /*
         * Colours come from the app's own theme (resources/css/app.css) via App\Support\BrandTheme, never typed here.
         * Typeface: the app's Inter, embedded when its files are present; otherwise DejaVu Sans, which DomPDF always has.
         * DomPDF has no flexbox or grid, so layout is tables and blocks.
         */
        @foreach ($fonts as $weight => $path)
        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: {{ $weight }};
            src: url('file://{{ $path }}') format('{{ str_ends_with($path, '.woff') ? 'woff' : (str_ends_with($path, '.otf') ? 'opentype' : 'truetype') }}');
        }
        @endforeach

        @page {
            size: a4 portrait;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: {!! count($fonts) ? "'Inter', " : '' !!}'DejaVu Sans', Helvetica, Arial, sans-serif;
        }

        body {
            color: {{ $colors['ink'] }};
            background: #ffffff;
            font-size: 12px;
            line-height: 1.4;
            padding: 26px 40px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
        }

        .label {
            font-size: 9px;
            font-weight: 700;
            color: {{ $colors['muted'] }};
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        /* One quiet frame: brand-blue header, hairline border, generous space. */
        .card {
            border: 1px solid {{ $colors['hairline'] }};
            border-radius: 14px;
            background: #ffffff;
            margin-bottom: 12px;
        }

        .header {
            background: {{ $colors['header'] }};
            border-radius: 13px 13px 0 0;
            padding: 16px 26px;
        }

        .header td { vertical-align: middle; }

        .header-org {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
        }

        .header-sub {
            font-size: 11px;
            color: {{ $colors['headerSoft'] }};
            margin-top: 3px;
        }

        .logo-img { height: 26px; width: auto; }

        .issued {
            margin-top: 7px;
            font-size: 10px;
            color: {{ $colors['headerSoft'] }};
            text-align: right;
        }

        .body { padding: 18px 26px 16px 26px; }

        .visiting-name {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.015em;
            color: {{ $colors['ink'] }};
            margin-top: 5px;
        }

        .visiting-unit {
            font-size: 13px;
            color: {{ $colors['body'] }};
            margin-top: 2px;
        }

        .rule {
            height: 1px;
            background: {{ $colors['hairline'] }};
            margin: 12px 0 4px 0;
        }

        .details td {
            padding: 5px 0;
            border-bottom: 1px solid {{ $colors['hairline'] }};
            vertical-align: top;
        }

        .details tr:last-child td { border-bottom: none; }

        .details .k {
            width: 30%;
            font-size: 10px;
            font-weight: 600;
            color: {{ $colors['muted'] }};
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding-top: 6px;
        }

        .details .v {
            font-size: 13px;
            font-weight: 600;
            color: {{ $colors['ink'] }};
        }

        .details .note {
            font-size: 10px;
            font-weight: 400;
            color: {{ $colors['muted'] }};
            margin-top: 2px;
        }

        /* The QR is what the pass exists for, so it gets the room. */
        .qr-wrap { text-align: center; margin-top: 12px; }

        .qr-frame {
            display: inline-block;
            padding: 8px;
            border: 1px solid {{ $colors['hairline'] }};
            border-radius: 14px;
            background: #ffffff;
        }

        .qr-img { width: 245px; height: 245px; display: block; }

        .qr-caption {
            margin-top: 6px;
            font-size: 10px;
            font-weight: 700;
            color: {{ $colors['muted'] }};
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .code-box {
            margin: 8px auto 0 auto;
            width: 300px;
            background: {{ $colors['wash'] }};
            border: 1px dashed {{ $colors['tintBorder'] }};
            border-radius: 10px;
            padding: 7px 14px 8px 14px;
            text-align: center;
        }

        .code-val {
            font-size: 30px;
            font-weight: 800;
            letter-spacing: 7px;
            color: {{ $colors['accent'] }};
            margin-top: 3px;
        }

        .guidelines {
            background: {{ $colors['tint'] }};
            border: 1px solid {{ $colors['tintBorder'] }};
            border-radius: 12px;
            padding: 10px 18px 9px 18px;
            margin-bottom: 12px;
        }

        .guidelines-title {
            font-size: 10px;
            font-weight: 700;
            color: {{ $colors['accent'] }};
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 3px;
        }

        .guidelines ul { margin-left: 15px; }

        .guidelines li {
            font-size: 11px;
            line-height: 1.4;
            color: {{ $colors['body'] }};
            margin-bottom: 1px;
        }

        .footer { font-size: 9.5px; color: {{ $colors['muted'] }}; }
        .footer td { vertical-align: top; }
        .footer-rule { height: 1px; background: {{ $colors['hairline'] }}; margin-bottom: 9px; }
    </style>
</head>
<body>
    @php
        // The white wordmark sits on the brand-blue header.
        $logoPath = public_path('assets/images/kontrol-white-logo-new.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;
    @endphp

    <div class="card">
        <!-- Header: the organization and estate appear here, once. -->
        <div class="header">
            <table>
                <tr>
                    <td style="width: 64%;">
                        <div class="header-org">{{ $organizationName }}</div>
                        <div class="header-sub">Visitor entry pass &middot; {{ $estateName }}</div>
                    </td>
                    <td style="width: 36%; text-align: right;">
                        @if($logoBase64)
                            <img src="{{ $logoBase64 }}" alt="Kontrol" class="logo-img">
                        @else
                            <div style="font-size: 16px; font-weight: 800; color: #ffffff; text-align: right;">KONTROL</div>
                        @endif
                        {{-- Neutral on purpose: a PDF is a snapshot and cannot know if the pass is later revoked. The gate decides. --}}
                        <div class="issued">Issued {{ $issuedOn }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="body">
            <!-- Who the visitor is coming to see: the first thing a guard asks. -->
            <div class="label">Visiting</div>
            <div class="visiting-name">{{ $hostName ?: $organizationName }}</div>
            @if(!empty($hostUnit))
                <div class="visiting-unit">{{ $hostUnit }}</div>
            @endif

            <div class="rule"></div>

            <table class="details">
                @if($passNumber)
                <tr>
                    <td class="k">Pass</td>
                    <td class="v">Pass {{ $passNumber }} of {{ $passTotal }}</td>
                </tr>
                @endif
                @if(!empty($batchLabel))
                <tr>
                    <td class="k">For</td>
                    <td class="v">{{ $batchLabel }}</td>
                </tr>
                @endif
                @if(!empty($role))
                <tr>
                    <td class="k">Role</td>
                    <td class="v">{{ $role }}</td>
                </tr>
                @endif
                <tr>
                    <td class="k">Pass type</td>
                    <td class="v">
                        {{ $entryMode['label'] }}
                        <div class="note">{{ $entryMode['hint'] }}</div>
                    </td>
                </tr>
                <tr>
                    <td class="k">Valid from</td>
                    <td class="v">{{ $validFrom }}</td>
                </tr>
                <tr>
                    <td class="k">Valid until</td>
                    <td class="v">{{ $validUntil }}</td>
                </tr>
                <tr>
                    <td class="k">Sent to</td>
                    <td class="v">
                        {{ $maskedEmail }}
                        <div class="note">Security may ask which email address this pass was sent to.</div>
                    </td>
                </tr>
            </table>

            <!-- The QR and its typed fallback, as they were: only larger and central. -->
            <div class="qr-wrap">
                <div class="qr-frame">
                    <img src="{{ $qrBase64 }}" alt="Pass QR Code" class="qr-img">
                </div>
                <div class="qr-caption">Scan at the security gate</div>
            </div>

            <div class="code-box">
                <div class="label">Or give this passcode</div>
                <div class="code-val">{{ $accessCode->code }}</div>
            </div>
        </div>
    </div>

    <!-- Guidelines: what we cannot verify by name, we ask for at the gate. -->
    <div class="guidelines">
        <div class="guidelines-title">At the gate</div>
        <ul>
            <li>Show this pass printed or on your phone when you arrive.</li>
            <li>The guard will scan the QR code, or check your 6-character passcode.</li>
            <li>Security may ask for valid photo ID.</li>
        </ul>
    </div>

    <!-- Footer -->
    <div class="footer-rule"></div>
    <table class="footer">
        <tr>
            <td style="width: 60%;">
                Pass reference: <strong>{{ $accessCode->pass_uuid }}</strong><br>
                Issued via Kontrol Access Management.
            </td>
            <td style="width: 40%; text-align: right;">
                Generated on {{ now()->format('M d, Y H:i') }}<br>
                &copy; {{ date('Y') }} Kontrol. All rights reserved.
            </td>
        </tr>
    </table>
</body>
</html>
