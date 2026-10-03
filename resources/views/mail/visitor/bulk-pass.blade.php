@extends('mail.layout')

{{-- Shown beside the subject in the inbox: the two things the visitor needs before even opening it. --}}
@section('preheader')Give security your passcode at the gate. Valid {{ $validFrom }} to {{ $validUntil }}.@endsection

@section('content')
    @php
        // Hex values come from the app theme (via the mailable), because email clients need them inline.
        $c = $colors;
        $headline = ! empty($batchLabel) ? "Your pass for {$batchLabel}" : 'Your visitor pass';
        $host = $hostName ? $hostName.($hostUnit ? ", {$hostUnit}" : '') : null;
    @endphp

    <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: {{ $c['header'] }}; margin-bottom: 10px;">Visitor pass</div>
    <h1 style="margin: 0 0 12px;">{{ $headline }}</h1>

    {{-- The organization and estate are named here, once. --}}
    <p style="margin: 0 0 28px;">
        <span class="bold">{{ $organizationName }}</span> has issued you a pass to visit
        @if($host)
            <span class="bold">{{ $host }}</span> at
        @endif
        <span class="bold">{{ $estateName }}</span>.
    </p>

    {{-- The pass: the passcode is the hero. The QR lives in the attached PDF. --}}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="background-color: {{ $c['wash'] }}; border: 1px solid {{ $c['hairline'] }}; border-radius: 14px; margin: 0 0 28px;">
        <tr>
            <td style="padding: 26px 24px 8px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: {{ $c['muted'] }};">Your passcode</div>
                <div style="font-size: 38px; line-height: 46px; font-weight: 800; letter-spacing: 8px; color: {{ $c['accent'] }}; padding: 6px 0 4px 8px;">{{ $accessCode->code }}</div>
                <div style="font-size: 13px; line-height: 20px; color: {{ $c['muted'] }};">Give this code to security, or show the QR code in the attached PDF.</div>
            </td>
        </tr>
        <tr>
            <td style="padding: 18px 24px 22px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid {{ $c['hairline'] }};">
                    @if($passNumber)
                    <tr>
                        <td style="padding: 12px 0 0; font-size: 12px; color: {{ $c['muted'] }};">Pass</td>
                        <td style="padding: 12px 0 0; font-size: 14px; font-weight: 600; color: {{ $c['ink'] }}; text-align: right;">{{ $passNumber }} of {{ $passTotal }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 12px 0 0; font-size: 12px; color: {{ $c['muted'] }};">Valid</td>
                        <td style="padding: 12px 0 0; font-size: 14px; font-weight: 600; color: {{ $c['ink'] }}; text-align: right;">{{ $validFrom }} – {{ $validUntil }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0 0; font-size: 12px; color: {{ $c['muted'] }};">Entry</td>
                        <td style="padding: 12px 0 0; font-size: 14px; font-weight: 600; color: {{ $c['ink'] }}; text-align: right;">{{ $entryMode['label'] }}</td>
                    </tr>
                    @if($maskedEmail)
                    <tr>
                        <td style="padding: 12px 0 0; font-size: 12px; color: {{ $c['muted'] }};">Sent to</td>
                        <td style="padding: 12px 0 0; font-size: 14px; font-weight: 600; color: {{ $c['ink'] }}; text-align: right;">{{ $maskedEmail }}</td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <div class="button-container" style="text-align: center; margin: 0 0 28px;">
        <a href="{{ $passUrl }}" class="button"
            style="display: inline-block; background-color: {{ $c['header'] }}; color: #ffffff !important; padding: 0 32px; line-height: 52px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600;">
            Open digital pass
        </a>
        @if($hasPdf)
            <div style="font-size: 13px; color: {{ $c['muted'] }}; margin-top: 12px;">Your pass is also attached as a PDF.</div>
        @endif
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="background-color: {{ $c['tint'] }}; border: 1px solid {{ $c['tintBorder'] }}; border-radius: 12px;">
        <tr>
            <td style="padding: 16px 20px; font-size: 14px; line-height: 22px; color: {{ $c['body'] }};">
                <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: {{ $c['accent'] }}; margin-bottom: 6px;">At the gate</div>
                Show your pass printed or on your phone.<br>
                Security may ask which email address this was sent to, and for valid photo ID.<br>
                This pass is for you. Please don't forward it.
            </td>
        </tr>
    </table>

    <div class="divider" style="height: 1px; background-color: {{ $c['hairline'] }}; margin: 28px 0 20px;"></div>

    <p style="font-size: 13px; line-height: 20px; color: {{ $c['muted'] }}; margin: 0;">If the button doesn't work, copy this link into your browser:<br>
        <a href="{{ $passUrl }}" style="color: {{ $c['header'] }}; word-break: break-all;">{{ $passUrl }}</a></p>
@endsection
