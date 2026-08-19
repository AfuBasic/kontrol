@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #eef2ff; color: #4338ca;">Security</div>
    <h1>New device sign-in attempt</h1>

    <p>Hello <span class="bold">{{ $userName }}</span>,</p>

    <p>We noticed a sign-in to your Kontrol account from a device we don't recognize.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 8px 0 28px;">
        <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">Device</p>
        <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #0f172a;">{{ $displayName }}</p>

        @if ($approximateLocation)
            <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">Approximate location</p>
            <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #0f172a;">{{ $approximateLocation }}</p>
        @endif

        <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">Time</p>
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">{{ $occurredAt }}</p>
    </div>

    <p>If this was you, authorize the device to continue signing in.</p>

    <div class="button-container">
        <a href="{{ $approveUrl }}" class="button">Authorize this device</a>
    </div>

    <p style="text-align: center;">
        <a href="{{ $denyUrl }}" style="color: #b91c1c; font-weight: 600; text-decoration: none;">This wasn't me</a>
    </p>

    <div class="divider"></div>

    <p style="font-size: 14px; color: #64748b;">If you did not try to sign in, deny the request. Your existing trusted devices will stay signed in.</p>
@endsection
