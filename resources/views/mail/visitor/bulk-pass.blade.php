@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">Access Pass</div>
    <h1>Your Visitor Access Pass</h1>

    <p>Hello,</p>
    <p>You have been issued a visitor access pass for <span class="bold">{{ $organizationName }}</span> at <span class="bold">{{ $estateName }}</span>.</p>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Access Code</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; font-size: 18px; text-align: right; letter-spacing: 2px;">{{ $accessCode->code }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Organization</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 600; text-align: right;">{{ $organizationName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 600; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Valid From</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 600; text-align: right;">{{ $validFrom }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Valid Until</td>
                <td style="color: #0f172a; font-weight: 600; text-align: right;">{{ $validUntil }}</td>
            </tr>
        </table>
    </div>

    <div class="button-container" style="text-align: center; margin: 32px 0;">
        <a href="{{ $passUrl }}" class="button shadow" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View Digital Pass & QR Code
        </a>
    </div>

    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
        <strong>Entry Instructions</strong><br>
        Show your digital pass or mention your access code to security personnel at the estate entrance gate for quick verification.
    </div>

    <div class="divider" style="height: 1px; background-color: #e2e8f0; margin: 32px 0;"></div>

    <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br>
    <a href="{{ $passUrl }}" style="color: #4f46e5; word-break: break-all;">{{ $passUrl }}</a></p>
@endsection
