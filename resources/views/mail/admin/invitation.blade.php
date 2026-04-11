@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fefcf1; color: #92400e; border: 1px solid #fde68a;">Invitation</div>
    <h1>You're invited to join</h1>
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    <p>You've been invited to join <span class="bold">{{ $estateName }}</span> as an <span class="bold">Administrator</span> on Kontrol.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Role</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">Administrator</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">{{ $estateName }}</td>
            </tr>
        </table>
    </div>
    
    <p>As an administrator, you'll have full access to manage estate operations, team members, and resident requests.</p>
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">Accept Invitation</a>
    </div>
    
    <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
        <strong>Validity</strong><br>
        This invitation link will expire in 72 hours. Please accept it within this timeframe to set up your account.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you have any questions, please reach out to the person who invited you or contact our support team.</p>
@endsection
