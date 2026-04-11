@extends('mail.layout')

@section('content')
    @if($passwordReset ?? false)
        <div class="badge" style="background-color: #fff1f2; color: #9f1239;">Security</div>
        <h1>Reset your password</h1>
    @else
        <div class="badge" style="background-color: #f0fdf4; color: #166534;">Community</div>
        <h1>Welcome to the household</h1>
    @endif
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    @if($passwordReset ?? false)
        <p><span class="bold">{{ $primaryResidentName }}</span> has requested a password reset for your household account at <span class="bold">{{ $estateName }}</span>.</p>
    @else
        <p><span class="bold">{{ $primaryResidentName }}</span> has added you as a household member at <span class="bold">{{ $estateName }}</span> on Kontrol.</p>
    @endif
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Role</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">Household Member</td>
            </tr>
        </table>
    </div>
    
    @if(!($passwordReset ?? false))
        <div style="margin-bottom: 32px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #f1f5f9;">
            <p style="margin: 0 0 16px; font-weight: 600; color: #0f172a; font-size: 14px;">As a household member, you'll be able to:</p>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
                <li style="margin-bottom: 8px;">Generate visitor access codes for your guests.</li>
                <li style="margin-bottom: 8px;">View important estate announcements.</li>
                <li style="margin-bottom: 8px;">Connect with your community.</li>
                <li>Access resident-only services.</li>
            </ul>
        </div>
    @endif
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow">{{ ($passwordReset ?? false) ? 'Reset Password' : 'Set Up Your Password' }}</a>
    </div>
    
    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
        <strong>Link Validity</strong><br>
        This link will expire in 72 hours. Please complete your setup within this timeframe.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you're having trouble, copy and paste this link: <br> <span style="font-size: 12px; color: #6366f1;">{{ $invitationUrl }}</span></p>
@endsection
