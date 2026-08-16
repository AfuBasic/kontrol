@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">Welcome</div>
    <h1>{{ ($isResend ?? false) ? 'Your invitation was resent' : 'Join your estate on Kontrol' }}</h1>
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    @if($isResend ?? false)
        <p>Your invitation to join <span class="bold">{{ $estateName }}</span> as a resident has been resent. Click the button below to accept it.</p>
    @else
        <p>You've been invited to join <span class="bold">{{ $estateName }}</span> as a resident. To get started and access your community features, please accept your invitation.</p>
    @endif
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="{{ $zoneName ? 'padding-bottom: 8px; ' : '' }}color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Role</td>
                <td style="{{ $zoneName ? 'padding-bottom: 8px; ' : '' }}color: #0f172a; font-weight: 700; text-align: right;">Resident</td>
            </tr>
            @if($zoneName)
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Zone</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">{{ $zoneName }}</td>
            </tr>
            @endif
        </table>
    </div>
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow">Accept Invitation</a>
    </div>
    
    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
        <strong>Link Validity</strong><br>
        This link will expire in 72 hours. Please accept the invitation within this timeframe.
    </div>
    
    @if(!($isResend ?? false))
        <div style="margin-top: 32px; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7; background-color: #f0fdf4;">
            <p style="margin: 0; font-size: 14px; color: #166534;">
                <strong>What's next?</strong><br>
                Once set up, you can log in to view estate announcements, manage visitor access, and stay connected with your community.
            </p>
        </div>
    @endif
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you're having trouble, copy and paste this link: <br> <span style="font-size: 12px; color: #6366f1;">{{ $invitationUrl }}</span></p>
@endsection
