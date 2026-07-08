@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fefce8; color: #a16207; border: 1px solid #fef08a;">Partner</div>
    <h1>Partner portal invitation</h1>
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    <p>You've been invited to join <span class="bold">{{ $partnerName }}</span> as a Partner Member on Kontrol. You'll be able to submit estate onboarding requests and track their progress through your dedicated partner portal.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Partner</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $partnerName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Role</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">Partner Member</td>
            </tr>
        </table>
    </div>
    
    <div style="margin-bottom: 32px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 16px; font-weight: 600; color: #0f172a; font-size: 14px;">As a partner member, you'll get:</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
            <li style="margin-bottom: 8px;">Access to your dedicated partner portal dashboard.</li>
            <li style="margin-bottom: 8px;">Submit and track estate onboarding requests.</li>
            <li style="margin-bottom: 8px;">Real-time performance analytics.</li>
            <li>Attractive and transparent commission structure.</li>
        </ul>
    </div>
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #a16207; box-shadow: 0 4px 14px 0 rgba(161, 98, 7, 0.3);">Accept Invitation</a>
    </div>
    
    <div style="background-color: #fefce8; border-radius: 12px; padding: 20px; font-size: 14px; color: #854d0e; border: 1px solid #fef08a;">
        <strong>Link Validity</strong><br>
        This invitation link will expire in 72 hours.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you're having trouble, copy and paste this link: <br> <span style="font-size: 12px; color: #6366f1;">{{ $invitationUrl }}</span></p>
@endsection