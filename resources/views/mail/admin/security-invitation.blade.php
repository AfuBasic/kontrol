@extends('mail.layout')

@section('content')
    @if($isExistingUser ?? false)
        <div class="badge" style="background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">Role Update</div>
        <h1>Security role added to your account</h1>

        <p>Hello <span class="bold">{{ $userName }}</span>,</p>

        <p>You have been assigned as <span class="bold">Security Personnel</span> at <span class="bold">{{ $estateName }}</span>. This role has been added to your Kontrol account, and your security dashboard and duties are now accessible immediately.</p>
    @else
        <div class="badge" style="background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">Personnel</div>
        <h1>{{ ($isResend ?? false) ? 'Your invitation was resent' : 'Security team invitation' }}</h1>
        
        <p>Hello <span class="bold">{{ $userName }}</span>,</p>
        
        @if($isResend ?? false)
            <p>Your invitation to join the security team at <span class="bold">{{ $estateName }}</span> has been resent. Click the button below to accept it.</p>
        @else
            <p>You've been invited to join the security team at <span class="bold">{{ $estateName }}</span>. To begin your duties and access the security dashboard, please accept your invitation.</p>
        @endif
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
        @if($isExistingUser ?? false)
            <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">Go to Dashboard</a>
        @else
            <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">Accept Invitation</a>
        @endif
    </div>
    
    @if($isExistingUser ?? false)
        <div style="background-color: #fef2f2; border-radius: 12px; padding: 20px; font-size: 14px; color: #991b1b; border: 1px solid #fecaca;">
            <strong>Already logged in?</strong><br>
            If you are currently signed in, simply switch to <strong>{{ $estateName }}</strong> from your account menu to access your security console.
        </div>
    @else
        @if(!($isResend ?? false))
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
    @endif
@endsection

