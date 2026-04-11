@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">Onboarding</div>
    <h1>Welcome to Kontrol</h1>
    
    <p>Hello,</p>
    
    <p>You've been invited to manage <span class="bold">{{ $estateName }}</span> on Kontrol. We're excited to help you streamline your estate operations with our powerful management platform.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Platform</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">Kontrol Estate Management</td>
            </tr>
        </table>
    </div>
    
    <p>To complete your setup and access your estate dashboard, please set up your account by clicking the button below.</p>
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">Set Up Your Password</a>
    </div>
    
    <div style="margin-bottom: 32px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 16px; font-weight: 600; color: #0f172a; font-size: 14px;">What happens next?</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
            <li style="margin-bottom: 8px;">Set up your password to secure your account.</li>
            <li style="margin-bottom: 8px;">Access your estate dashboard and settings.</li>
            <li style="margin-bottom: 8px;">Invite your team and start managing residents.</li>
        </ul>
    </div>
    
    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
        <strong>Link Validity</strong><br>
        This invitation link will expire in 72 hours.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you're having trouble, copy and paste this link: <br> <span style="font-size: 12px; color: #6366f1;">{{ $invitationUrl }}</span></p>
@endsection
