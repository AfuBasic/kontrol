@extends('mail.layout')

@section('content')
    @if($isPasswordReset ?? false)
        <div class="badge" style="background-color: #fff1f2; color: #9f1239;">Security</div>
        <h1>Reset your password</h1>
    @else
        <div class="badge" style="background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">Personnel</div>
        <h1>Security team invitation</h1>
    @endif
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    @if($isPasswordReset ?? false)
        <p>A password reset was requested for your security personnel account at <span class="bold">{{ $estateName }}</span>. Click the button below to secure your access.</p>
    @else
        <p>You've been invited to join the security team at <span class="bold">{{ $estateName }}</span>. To begin your duties and access the security dashboard, please accept your invitation.</p>
    @endif
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Position</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">Security Personnel</td>
            </tr>
        </table>
    </div>
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">{{ ($isPasswordReset ?? false) ? 'Login to your account' : 'Accept Invitation' }}</a>
    </div>
    
    @if(!($isPasswordReset ?? false))
        <div style="margin-top: 32px; padding: 20px; border-radius: 12px; border: 1px solid #fecaca; background-color: #fef2f2;">
            <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
                <strong>Duties & Dashboard</strong><br>
                Once set up, you will have access to the security dashboard to manage access logs, respond to incidents, and coordinate with estate administration.
            </p>
        </div>
    @endif
    
    <div style="margin-top: 32px; background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
        <strong>Link Validity</strong><br>
        This link will expire in 72 hours. Please accept the invitation within this timeframe.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you're having trouble, copy and paste this link: <br> <span style="font-size: 12px; color: #6366f1;">{{ $invitationUrl }}</span></p>
@endsection
