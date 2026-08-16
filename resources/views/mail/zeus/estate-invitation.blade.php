@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #e0e7ff; color: #3730a3;">Estate Administration</div>
    <h1>Your Kontrol estate account is ready.</h1>
    
    <p>Hello, {{ $userName }},</p>
    
    <p>Your administrator account for <span class="bold">{{ $estateName }}</span> has been registered on Kontrol. You're the designated administrator for this estate, and your account is ready to be activated.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Access Level</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">Estate Administrator</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Platform</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">Kontrol Estate Management</td>
            </tr>
        </table>
    </div>
    
    <p>To activate your account and access your estate dashboard, please click the button below.</p>
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">Activate my account</a>
    </div>
    
    <div style="margin-bottom: 32px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 16px; font-weight: 600; color: #0f172a; font-size: 14px;">What happens next?</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
            <li style="margin-bottom: 8px;">Verify your email address to activate your account.</li>
            <li style="margin-bottom: 8px;">Review and configure your estate settings.</li>
            <li style="margin-bottom: 8px;">Add your team and start inviting residents.</li>
        </ul>
        <p style="margin: 16px 0 0; font-size: 13px; color: #64748b;">Once your account is activated, you'll be guided through setting up your estate.</p>
    </div>
    
    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
        <strong>Link Validity</strong><br>
        This activation link will expire in 7 days.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you're having trouble, copy and paste this link: <br> <span style="font-size: 12px; color: #6366f1;">{{ $invitationUrl }}</span></p>
@endsection
