@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #ecfdf5; color: #047857;">Security</div>
    <h1>New device added</h1>

    <p>Hello <span class="bold">{{ $userName }}</span>,</p>

    <p>A new device was added to your Kontrol account.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 8px 0 28px;">
        <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">Device</p>
        <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #0f172a;">{{ $displayName }}</p>
        <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">Added</p>
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">{{ $addedAt }}</p>
    </div>

    <p>If you don't recognize this device, remove its access from Trusted Devices.</p>

    <div class="button-container">
        <a href="{{ $devicesUrl }}" class="button">Manage trusted devices</a>
    </div>
@endsection
