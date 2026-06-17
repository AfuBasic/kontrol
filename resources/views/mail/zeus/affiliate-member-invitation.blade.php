@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fff1f2; color: #9f1239; border: 1px solid #fecaca;">Partner</div>
    <h1>Affiliate invitation</h1>
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    <p>You've been invited to join <span class="bold">{{ $affiliateName }}</span> as an Affiliate Member on Kontrol. This is an opportunity to partner with us and expand your professional reach through our affiliate network.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Partner</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $affiliateName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Role</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">Affiliate Member</td>
            </tr>
        </table>
    </div>
    
    <div style="margin-bottom: 32px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 16px; font-weight: 600; color: #0f172a; font-size: 14px;">As an affiliate member, you'll get:</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
            <li style="margin-bottom: 8px;">Access to your dedicated affiliate dashboard.</li>
            <li style="margin-bottom: 8px;">Real-time tracking and analytics.</li>
            <li style="margin-bottom: 8px;">Marketing materials and strategic support.</li>
            <li>Competitive and rewarding commission structure.</li>
        </ul>
    </div>
    
    <div class="button-container">
        <a href="{{ $invitationUrl }}" class="button shadow" style="background-color: #9f1239; box-shadow: 0 4px 14px 0 rgba(159, 18, 57, 0.3);">Accept Invitation</a>
    </div>
    
    <div style="background-color: #fff1f2; border-radius: 12px; padding: 20px; font-size: 14px; color: #9f1239; border: 1px solid #fecaca;">
        <strong>Link Validity</strong><br>
        This invitation link will expire in 72 hours.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you're having trouble, copy and paste this link: <br> <span style="font-size: 12px; color: #6366f1;">{{ $invitationUrl }}</span></p>
@endsection
